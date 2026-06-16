const config = require('../../config/config');

const winston = require('winston');
const fetch = require('node-fetch');
const multer = require('multer');
const { logConversation } = require('../../utils/conversationLogger');

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
        return [
            { role: 'system', content: systemContent },
            {
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    { type: 'image_url', image_url: { url: imageDataUrl } },
                ],
            },
        ];
    }

    // Text-only format
    return [
        { role: 'system', content: systemContent },
        { role: 'user', content: prompt },
    ];
}

async function getResponse(ctx) {
    const { prompt, image } = ctx.request.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        ctx.status = 400;
        ctx.body = { error: 'A prompt is required.' };
        return;
    }

    const trimmed = prompt.trim();
    const imageDataUrl = image && typeof image === 'string' ? image : null;

    logger.info('getResponse called', { prompt: trimmed, hasImage: !!imageDataUrl });

    try {
        // If prompt looks like a URL, fetch and extract text from it
        let effectivePrompt = trimmed;
        if (!imageDataUrl && URL_PATTERN.test(trimmed)) {
            try {
                const content = await fetchUrlContent(trimmed);
                if (content) {
                    effectivePrompt = content.substring(0, MAX_PROMPT_LENGTH);
                    logger.info('URL prompt resolved', { url: trimmed, contentLength: content.length, effectiveLength: effectivePrompt.length });
                }
            } catch (err) {
                logger.warn('URL fetch failed, using original prompt', { url: trimmed, error: err.message });
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

        ctx.body = { says: llmResponse };
        logConversation(ctx, effectivePrompt, llmResponse);
        logger.info('Got response', { fn: 'getResponse', prompt: effectivePrompt, response: llmResponse });
    } catch (err) {
        logger.error('Error getting response', { fn: 'getResponse', prompt: trimmed, error: err.message });
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
