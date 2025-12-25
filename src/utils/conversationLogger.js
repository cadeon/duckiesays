const fs = require('fs');
const path = require('path');

// Ensure the logs directory exists
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Import the encoding function from permalink utility
const { createPermalink } = require('./permalink');

/**
 * Logs a conversation (prompt and response) in a structured, pretty format
 * @param {string} prompt - The user's input prompt
 * @param {string} response - The LLM's response
 */
function logConversation(prompt, response) {
  // Clean the prompt and response to prevent log formatting issues
  const cleanPrompt = prompt.replace(/\n/g, ' ').replace(/\r/g, '');
  const cleanResponse = response.replace(/\n/g, ' ').replace(/\r/g, '');
  
  // Create the encoded parameter that would be in guru-meditation URL param
  const encodedParam = createPermalink(prompt, response);
  
  // Create the conversation log entry with only the clean data
  const formattedEntry = `=== ${new Date().toISOString()} ===\nUser: ${cleanPrompt}\nDuckie: ${cleanResponse}\n\nhttps://duckiesays.com/?guru-meditation=${encodedParam}\n${'='.repeat(50)}\n`;
  
  // Create a dedicated logger for conversations with daily rotation
  const winston = require('winston');
  require('winston-daily-rotate-file');
  
  // Create a separate logger for conversations only
  const conversationLogger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
      new (winston.transports.DailyRotateFile)({
        filename: `${logDir}/guru-meditations.log`,
        datePattern: 'YYYY-MM-DD',
        prepend: true,
        maxFiles: '14d', // Keep logs for 14 days
      })
    ]
  });
  
  conversationLogger.info(formattedEntry);
}

module.exports = {
  logConversation
};
