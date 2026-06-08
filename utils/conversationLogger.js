const fs = require('fs');
const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');

const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Base URL for permalinks — override via DUCKIE_BASE_URL env var
const baseUrl = process.env.DUCKIE_BASE_URL || 'https://duckiesays.com';

function encodePermalink(prompt, response) {
  try {
    var json = JSON.stringify({ prompt, response });
    return Buffer.from(encodeURIComponent(json)).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  } catch (e) {
    return '';
  }
}

function logConversation(prompt, response) {
  const cleanPrompt = prompt.replace(/\n/g, ' ').replace(/\r/g, '').trim();
  const cleanResponse = response.replace(/\n/g, ' ').replace(/\r/g, '').trim();

  const encoded = encodePermalink(cleanPrompt, cleanResponse);
  const permalink = `${baseUrl}/?guru_meditation=${encoded}`;

  const entry = [
    `=== ${new Date().toISOString()} ===`,
    `User: ${cleanPrompt}`,
    `Duckie: ${cleanResponse}`,
    '',
    permalink,
    '='.repeat(50),
    ''
  ].join('\n');

  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
      new (winston.transports.DailyRotateFile)({
        filename: `${logDir}/guru-meditations.log`,
        datePattern: 'YYYY-MM-DD',
        prepend: true,
        maxFiles: '14d'
      })
    ]
  });

  logger.info(entry);
}

module.exports = { logConversation };
