const config = require('../../config/config');

const winston = require('winston');
const fetch = require('node-fetch');

const logger = winston.loggers.get('default');



async function getResponse(ctx) {
	const { prompt } = ctx.request.body;
	logger.info('getResponse called', { prompt });

	try {
				const fullPrompt = config.ollama.systemPrompt(config.ollama.max_tokens, prompt);

		const response = await fetch(config.ollama.apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: config.ollama.model,
				prompt: fullPrompt,
				stream: false, // Get the full response at once
				options: {
					temperature: config.ollama.temperature,
					num_predict: config.ollama.max_tokens,
				},
			}),
		});

		if (!response.ok) {
			throw new Error(`Ollama API returned an error: ${response.statusText}`);
		}

		const data = await response.json();
		const llmResponse = data.response.trim();

		ctx.body = { says: llmResponse };
		logger.info('Got response', { fn: 'getResponse', prompt, response: llmResponse });
	} catch (err) {
		logger.error('Error getting response', { fn: 'getResponse', prompt, error: err.message });
		ctx.status = 500;
		ctx.body = { error: 'Failed to get a response from the duck.' };
	}
}

module.exports = {
	getResponse,
};

