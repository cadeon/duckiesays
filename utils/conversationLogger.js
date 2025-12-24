const fs = require('fs');
const path = require('path');

// Ensure the logs directory exists
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Gets the user-friendly IP identifier (removes IPv6 prefix if present)
 * @param {string} ip - IP address
 * @returns {string} Cleaned IP identifier safe for filenames
 */
function getUserIdentifier(ip) {
  if (!ip) return 'unknown';
  // Handle IPv6 format by removing the ::ffff: prefix if present
  let cleanIp = ip.replace('::ffff:', '');
  
  // Replace problematic characters for filenames with underscores
  cleanIp = cleanIp.replace(/[:/\\?*|"<>]/g, '_');
  
  return cleanIp;
}

/**
 * Logs a conversation (prompt and response) in a structured, pretty format with user identifier
 * @param {string} prompt - The user's input prompt  
 * @param {string} response - The LLM's response
 * @param {string} ip - User's IP address
 */
function logConversation(prompt, response, ip) {
  const timestamp = new Date().toISOString();
  const userIdentifier = getUserIdentifier(ip);
  
  // Create log file name with IP in it - one file per user
  const logFileName = path.join(logDir, `conversation-${userIdentifier}.log`);
  
  // Clean the prompt and response to prevent log formatting issues
  const cleanPrompt = prompt.replace(/\n/g, ' ').replace(/\r/g, '');
  const cleanResponse = response.replace(/\n/g, ' ').replace(/\r/g, '');
  
  // Append to the user's conversation log file with pretty formatting and whitespace
  const formattedEntry = `\n=== Conversation at ${timestamp} ===\nUser: ${cleanPrompt}\nDuckie: ${cleanResponse}\n${'='.repeat(50)}\n`;
  
  fs.appendFileSync(logFileName, formattedEntry);
}

/**
 * Reads all conversation logs for a specific user
 * @param {string} ip - User's IP address
 * @returns {Array} Array of conversation objects
 */
function readUserConversations(ip) {
  const userIdentifier = getUserIdentifier(ip);
  const logFileName = path.join(logDir, `conversation-${userIdentifier}.log`);
  
  if (!fs.existsSync(logFileName)) {
    return [];
  }

  const fileContent = fs.readFileSync(logFileName, 'utf8');
  const conversations = [];
  
  // Simple parser for conversation entries
  const entries = fileContent.split('=== Conversation at ').filter(entry => entry.trim());
  
  entries.forEach(entry => {
    const lines = entry.split('\n');
    if (lines.length >= 3) {
      const timestamp = lines[0].replace('===', '').trim();
      const promptLine = lines[1];
      const responseLine = lines[2];
      
      // Extract prompt and response
      const prompt = promptLine.replace('Prompt: ', '').trim();
      const response = responseLine.replace('Response: ', '').trim();
      
      conversations.push({
        timestamp,
        prompt,
        response
      });
    }
  });
  
  return conversations;
}

/**
 * Gets all conversation log files in the logs directory
 * @returns {Array} Array of log file names
 */
function getAllConversationLogFiles() {
  try {
    return fs.readdirSync(logDir)
      .filter(file => file.startsWith('conversation-') && file.endsWith('.log'))
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    return [];
  }
}

module.exports = {
  logConversation,
  readUserConversations,
  getAllConversationLogFiles
};