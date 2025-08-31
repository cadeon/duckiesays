const config = require('../../config/config');

const winston = require('winston');
const fetch = require('node-fetch');

const logger = winston.loggers.get('default');



async function getResponse(ctx) {
	const { prompt } = ctx.request.body;
	logger.info('getResponse called', { prompt });

	if (!prompt) {
		ctx.status = 400;
		ctx.body = { error: 'Prompt is required' };
		return;
	}

	try {
		// Create a prompt string that works with LM Studio's API format
		const fullPrompt = `${config.lmstudio.systemPrompt}\n\nUser: ${prompt}\nAssistant:`;

		const requestBody = {
			model: config.lmstudio.model,
			prompt: fullPrompt, // This format works with LM Studio's API
			max_tokens: config.lmstudio.max_tokens,
			temperature: config.lmstudio.temperature,
		};

		logger.info('Sending request to LM Studio', { requestBody });

		const response = await fetch(config.lmstudio.apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const errorText = await response.text();
			logger.error('LM Studio API error', { status: response.status, text: errorText });
			throw new Error(`LM Studio API returned an error: ${response.statusText}`);
		}

		const data = await response.json();
		
		logger.info('Received response from LM Studio', { data });

		// Extract the text response
		let llmResponse;
		if (data.choices && data.choices[0] && data.choices[0].text) {
			llmResponse = data.choices[0].text.trim();
		} else {
			throw new Error('Unexpected response format: no text field in choices');
		}

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
