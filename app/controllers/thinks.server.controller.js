const config = require('../../config/config');

const winston = require('winston');
const fetch = require('node-fetch');
const { logConversation } = require('../../utils/conversationLogger');

const logger = winston.loggers.get('default');

const MAX_PROMPT_LENGTH = 1000;
const REQUEST_TIMEOUT_MS = 30000;

async function getResponse(ctx) {
	const { prompt } = ctx.request.body;

	if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
		ctx.status = 400;
		ctx.body = { error: 'A prompt is required.' };
		return;
	}

	const trimmed = prompt.trim();
	if (trimmed.length > MAX_PROMPT_LENGTH) {
		ctx.status = 400;
		ctx.body = { error: `Prompt must be ${MAX_PROMPT_LENGTH} characters or less.` };
		return;
	}

	logger.info('getResponse called', { prompt: trimmed });

	try {
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
					{ role: 'system', content: config.llm.systemPrompt(trimmed) },
					{ role: 'user', content: trimmed },
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
			logConversation(ctx, trimmed, llmResponse);
			logger.info('Got response', { fn: 'getResponse', prompt: trimmed, response: llmResponse });
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
