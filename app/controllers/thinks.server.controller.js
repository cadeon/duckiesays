const config = require('../../config/config');

const winston = require('winston');
const fetch = require('node-fetch');
const multer = require('multer');
const { logConversation } = require('../../utils/conversationLogger');
const { validateImage, sanitizePrompt } = require('../middleware/validate');

const logger = winston.loggers.get('default');

const MAX_PROMPT_LENGTH = 1000;
const URL_FETCH_TIMEOUT_MS = 10000;
const REQUEST_TIMEOUT_MS = 30000;
const URL_PATTERN = /^https?:\/\/.+$/i;

// Multer instance for the upload route
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    },
}).single('image');

function stripHtml(html) {
    return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
}

async function fetchUrlContent(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), URL_FETCH_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'DuckieOracle/1.0' },
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const html = await response.text();
        return stripHtml(html);
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Build the messages array for the LLM call.
 * If an image data URL is provided, uses the vision message format.
 */
function buildMessages(prompt, imageDataUrl) {
    const systemContent = config.llm.systemPrompt(prompt);

    if (imageDataUrl) {
        // Vision format: content is an array of parts
        const textParts = [];
        if (prompt) {
            textParts.push({ type: 'text', text: prompt });
        }
        textParts.push({ type: 'image_url', image_url: { url: imageDataUrl } });
        return [
            { role: 'system', content: systemContent },
            {
                role: 'user',
                content: textParts,
            },
        ];
    }

    // Text-only format
    return [
        { role: 'system', content: systemContent },
        { role: 'user', content: prompt },
    ];
}

/**
 * Ask the LLM for a one-line description of an image.
 * Used for permalink generation — no image data stored, just a text summary.
 */
async function describeImage(imageDataUrl) {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (config.llm.apiKey) {
        headers['Authorization'] = `Bearer ${config.llm.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(config.llm.apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: config.llm.model,
                messages: [
                    {
                        role: 'system',
                        content: 'Describe the image in one short sentence. No preamble, no quotes, just the description.',
                    },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: 'What is in this image?' },
                            { type: 'image_url', image_url: { url: imageDataUrl } },
                        ],
                    },
                ],
                max_tokens: 50,
                temperature: 0.3,
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(`LLM API returned ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    } finally {
        clearTimeout(timeoutId);
    }
}

async function getResponse(ctx) {
    // Validate and sanitize inputs
    var prompt = sanitizePrompt(ctx.request.body.prompt);
    var imageDataUrl = null;
    try {
        imageDataUrl = validateImage(ctx.request.body.image);
    } catch (err) {
        ctx.status = 400;
        ctx.body = { error: err.message };
        return;
    }

    // Allow image-only submission — text prompt is optional when there's an image
    if (!prompt && !imageDataUrl) {
        ctx.status = 400;
        ctx.body = { error: 'A prompt or image is required.' };
        return;
    }

    logger.info('getResponse called', { prompt, hasImage: !!imageDataUrl });

    try {
        // If prompt looks like a URL, fetch and extract text from it
        let effectivePrompt = prompt;
        if (prompt && !imageDataUrl && URL_PATTERN.test(prompt)) {
            try {
                const content = await fetchUrlContent(prompt);
                if (content) {
                    effectivePrompt = content.substring(0, MAX_PROMPT_LENGTH);
                    logger.info('URL prompt resolved', { url: prompt, contentLength: content.length, effectiveLength: effectivePrompt.length });
                }
            } catch (err) {
                logger.warn('URL fetch failed, using original prompt', { url: prompt, error: err.message });
            }
        }

        if (effectivePrompt.length > MAX_PROMPT_LENGTH) {
            ctx.status = 400;
            ctx.body = { error: `Prompt must be ${MAX_PROMPT_LENGTH} characters or less.` };
            return;
        }

        const headers = {
            'Content-Type': 'application/json',
        };
        if (config.llm.apiKey) {
            headers['Authorization'] = `Bearer ${config.llm.apiKey}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        const response = await fetch(config.llm.apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: config.llm.model,
                messages: buildMessages(effectivePrompt, imageDataUrl),
                max_tokens: config.llm.max_tokens,
                temperature: config.llm.temperature,
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errBody = await response.text().catch(() => '');
            throw new Error(`LLM API returned ${response.status}: ${response.statusText} ${errBody}`);
        }

        const data = await response.json();
        const llmResponse = data.choices[0].message.content.trim();

        // If there was an image, get a text description for permalink purposes
        let imageDescription = null;
        if (imageDataUrl) {
            try {
                imageDescription = await describeImage(imageDataUrl);
            } catch (descErr) {
                logger.warn('Image description failed', { error: descErr.message });
            }
        }

        ctx.body = { says: llmResponse, imageDescription };
        logConversation(ctx, effectivePrompt, llmResponse);
        logger.info('Got response', { fn: 'getResponse', prompt: effectivePrompt, response: llmResponse });
    } catch (err) {
        logger.error('Error getting response', { fn: 'getResponse', prompt, error: err.message });
        if (err.name === 'AbortError') {
            ctx.status = 504;
            ctx.body = { error: 'The duck took too long to think.' };
        } else {
            ctx.status = 500;
            ctx.body = { error: 'Failed to get a response from the duck.' };
        }
    }
}

/**
 * Handle multipart image upload. Returns the image as a base64 data URL
 * so the frontend can include it in a subsequent /thinks call.
 */
async function uploadImage(ctx) {
    return new Promise((resolve, reject) => {
        upload(ctx.req, ctx.res, (err) => {
            if (err) {
                ctx.status = 400;
                ctx.body = { error: err.message || 'Invalid file upload.' };
                resolve();
                return;
            }

            if (!ctx.req.file) {
                ctx.status = 400;
                ctx.body = { error: 'No image file provided. Use field name "image".' };
                resolve();
                return;
            }

            const file = ctx.req.file;
            const base64 = file.buffer.toString('base64');
            const dataUrl = `data:${file.mimetype};base64,${base64}`;

            logger.info('Image uploaded', { mimetype: file.mimetype, size: file.size });

            ctx.body = { image: dataUrl };
            resolve();
        });
    });
}

module.exports = {
    getResponse,
    uploadImage,
};
