var fs = require('fs');
var winston = require('winston');
require('winston-daily-rotate-file');

var logDir = 'log';

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

winston.loggers.options.transports = [
  new winston.transports.DailyRotateFile({
    name: 'access-log',
    filename: `${logDir}/-access.log`,
    datePattern: 'yyyy-MM-dd',
    prepend: true,
    level: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? 'verbose' : 'info'
  }),
  new winston.transports.DailyRotateFile({
    name: 'error-log',
    filename: `${logDir}/-error.log`,
    datePattern: 'yyyy-MM-dd',
    prepend: true,
    level: 'error',
    handleExceptions: true,
    humanReadableUnhandledException: true
  }),
  new (winston.transports.Console)({
    colorize: true,
    level: 'info',
    timestamp: true,
    showLevel : false
  })
]
var env = process.env.NODE_ENV || 'development';

module.exports = require('./env/'+ env +'.js');
