const config = require('../../config/config');

const winston = require('winston');
const fetch = require('node-fetch');
const { logConversation } = require('../../src/utils/conversationLogger');

const logger = winston.loggers.get('default');



async function getResponse(ctx) {
	const { prompt } = ctx.request.body;
	// Removed verbose info logging - only errors will be logged

	if (!prompt) {
		ctx.status = 400;
		ctx.body = { error: 'Prompt is required' };
		logger.info('Bad request - missing prompt', { 
      url: ctx.url,
      method: ctx.method
    });
		return;
	}

	try {
		// Determine which provider to use based on configuration
		const selectedProvider = config.defaultProvider;
		const providerConfig = config[selectedProvider];
		
		if (!providerConfig) {
			throw new Error(`Unknown provider: ${selectedProvider}`);
		}

		let llmResponse;
		
		if (selectedProvider === 'ollama') {
			// Format for Ollama API - let's try the most basic approach
			const fullPrompt = providerConfig.systemPrompt(providerConfig.max_tokens, prompt);
			
			// Using Ollama's basic generate endpoint with proper parameters
			const requestBody = {
				model: providerConfig.model,
				prompt: fullPrompt,
				temperature: providerConfig.temperature,
				num_predict: providerConfig.max_tokens,  // Ollama uses num_predict
				stream: false  // Explicitly disable streaming for single response
			};

			const response = await fetch(providerConfig.apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const errorText = await response.text();
				logger.error('Ollama API error', { 
          status: response.status, 
          text: errorText,
          url: ctx.url,
          method: ctx.method
        });
				throw new Error(`Ollama API returned an error: ${response.statusText}`);
			}

			const responseText = await response.text();
			
			logger.debug('Ollama raw response:', { 
				text: responseText.substring(0, 300) + '...', // Truncate for log readability
				url: ctx.url,
				method: ctx.method 
			});
			
			try {
				const data = JSON.parse(responseText);
				
				if (data.response) {
					llmResponse = data.response.trim();
				} else if (data.error) {
					throw new Error(`Ollama error: ${data.error}`);
				} else if (typeof data === 'string') {
					// If it's a direct string response, use that
					llmResponse = data.trim();
				} else {
					throw new Error('Unexpected Ollama response format: no response field found');
				}
			} catch (parseError) {
				logger.error('Ollama JSON parse error', { 
					error: parseError.message,
					responseTextLength: responseText.length,
					first200Chars: responseText.substring(0, 200) + '...',
					url: ctx.url,
					method: ctx.method 
				});
				
				// If we got something that looks like a valid response despite parse error
				if (responseText.trim().length > 0) {
					// Sometimes Ollama might return a simple string response
					llmResponse = responseText.trim();
				} else {
					throw new Error(`Ollama response is not valid JSON: ${parseError.message}`);
				}
			}
			
		} else {
			// Format for LM Studio API (default)
			const fullPrompt = `${providerConfig.systemPrompt}\n\nUser: ${prompt}\nAssistant:`; 

			const requestBody = {
				model: providerConfig.model,
				prompt: fullPrompt, // This format works with LM Studio's API
				max_tokens: providerConfig.max_tokens,
				temperature: providerConfig.temperature,
			};

			const response = await fetch(providerConfig.apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const errorText = await response.text();
				logger.error('LM Studio API error', { 
          status: response.status, 
          text: errorText,
          url: ctx.url,
          method: ctx.method
        });
				throw new Error(`LM Studio API returned an error: ${response.statusText}`);
			}

			const data = await response.json();
			
			// Extract the text response from LM Studio
			if (data.choices && data.choices[0] && data.choices[0].text) {
				llmResponse = data.choices[0].text.trim();
			} else {
				throw new Error('Unexpected response format: no text field in choices');
			}
		}

		ctx.body = { says: llmResponse };
		
		// Log the conversation in a pretty format for later review
		logConversation(prompt, llmResponse);
		
		logger.info('Got response', { 
      fn: 'getResponse', 
      prompt, 
      response: llmResponse,
      url: ctx.url,
      method: ctx.method
    });
	} catch (err) {
		logger.error('Error getting response', { 
      fn: 'getResponse', 
      prompt, 
      error: err.message,
      url: ctx.url,
      method: ctx.method
    });
		ctx.status = 500;
		ctx.body = { error: 'Failed to get a response from the duck.' };
	}
}

module.exports = {
	getResponse,
};
