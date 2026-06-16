const config = require('../../config/config');

const winston = require('winston');
const fetch = require('node-fetch');
const { logConversation } = require('../../utils/conversationLogger');

const logger = winston.loggers.get('default');

const MAX_PROMPT_LENGTH = 1000;
const URL_FETCH_TIMEOUT_MS = 10000;
const REQUEST_TIMEOUT_MS = 30000;
const URL_PATTERN = /^https?:\/\/.+$/i;

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

async function getResponse(ctx) {
	const { prompt } = ctx.request.body;

	if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
		ctx.status = 400;
		ctx.body = { error: 'A prompt is required.' };
		return;
	}

	const trimmed = prompt.trim();

	logger.info('getResponse called', { prompt: trimmed });

	try {
		// If prompt looks like a URL, fetch and extract text from it
		let effectivePrompt = trimmed;
		if (URL_PATTERN.test(trimmed)) {
			try {
				const content = await fetchUrlContent(trimmed);
				if (content) {
					// Truncate to reasonable length for LLM context
					effectivePrompt = content.substring(0, MAX_PROMPT_LENGTH);
					logger.info('URL prompt resolved', { url: trimmed, contentLength: content.length, effectiveLength: effectivePrompt.length });
				}
			} catch (err) {
				logger.warn('URL fetch failed, using original prompt', { url: trimmed, error: err.message });
				// Fall through to use original prompt
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
				messages: [
					{ role: 'system', content: config.llm.systemPrompt(effectivePrompt) },
					{ role: 'user', content: effectivePrompt },
				],
				max_tokens: config.llm.max_tokens,
				temperature: config.llm.temperature,
			}),
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			throw new Error(`LLM API returned ${response.status}: ${response.statusText}`);
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

module.exports = {
	getResponse,
};
