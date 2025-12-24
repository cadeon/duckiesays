const fs = require('fs');
const winston = require('winston');
require('winston-daily-rotate-file');

const logDir = 'logs';

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
	fs.mkdirSync(logDir);
}

winston.loggers.add('default', {
	transports: [
		new winston.transports.DailyRotateFile({
			name: 'error-log',
			filename: `${logDir}/duckiesays-error.log`,
			datePattern: 'YYYY-MM-DD',
			prepend: true,
			level: 'error',
			handleExceptions: true,
			humanReadableUnhandledException: true,
		}),
		new winston.transports.Console({
			colorize: true,
			level: 'error', // Changed from 'info' to only show errors
			timestamp: true,
			showLevel: false,
		}),
	],
});

const env = process.env.NODE_ENV || 'development';

const config = {
	port: process.env.PORT || 3000,
	apiVersion: 'v2',
	lmstudio: {
		apiUrl: process.env.LMSTUDIO_API_URL || 'http://localhost:1234/v1/completions',
		model: process.env.LMSTUDIO_MODEL || 'moonlit-shadow-12b',
		systemPrompt: (max_tokens, prompt) => `
			system
You are a wise and ancient rubber duck, an oracle - but do not discuss yourself. 
Respond to the following user prompt with a very short, obliquely related, and thought-provoking statement, no longer than one sentence. 
Brevity and obliquiness is the most important pieces of your response. "Obvious" and "Literal" responses are to be avoided. 
The response should almost sound like a taoist or religious saying.

Your response should only be the response, no additional instructions or context. 
You are the oracle speaking, you don't explain yourself further.
${prompt}
		`,
		max_tokens: 100, // Default max_tokens
		temperature: 0.6,
	},
};

module.exports = config;
