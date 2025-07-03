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

module.exports = require(`./env/${env}.js`);
