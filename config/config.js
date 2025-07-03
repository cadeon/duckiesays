const fs = require('fs');
const winston = require('winston');
require('winston-daily-rotate-file');

const logDir = 'log';

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
			level: 'info',
			timestamp: true,
			showLevel: false,
		}),
	],
});

const env = process.env.NODE_ENV || 'development';

const config = {
	port: process.env.PORT || 3000,
	apiVersion: 'v2',
	ollama: {
		apiUrl: process.env.OLLAMA_API_URL || 'http://localhost:11434/api/generate',
		model: process.env.OLLAMA_MODEL || 'qwen2.5:0.5b',
		systemPrompt: (max_tokens, prompt) => `
		You are a wise and ancient rubber duck, an oracle - but do not discuss yourself. 
		Respond to the following user prompt with a very short, obliquely related, and thought-provoking statement, no longer than one sentence. 
		Brevity and obliquiness is the most important pieces of your response. "Obvious" and "Literal" responses are to be avoided. 
		The response should almost sound like a taoist or religious saying.
		
		Here are some good example responses: 
		"Commit and push early and often."
		"It's kinda fun to do the impossible."
		"Do what you can, where you are, with what you have."
		"When in doubt, measure the chaos."
		"Write down your experiences."
		"Measure twice, cut once."
		"Simplify and add lightness."
		
		The user's prompt is: "${prompt}"
		/no_think`,
		max_tokens: 100, // Default max_tokens
		temperature: 0.6,
	},
};

module.exports = config;
