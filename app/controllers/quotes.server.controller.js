const Quote = require('../models/quote.server.model');
const debug = require('debug')('quotes');
const winston = require('winston');

const logger = winston.createLogger({ transports: winston.loggers.options.transports });

async function getQuote(ctx) {
  const { sayId } = ctx.params;
  logger.info('getQuote called', { quote_id: sayId });

  try {
    const quote = (await Quote.getSingleQuote(sayId))[0];
    debug(quote);
    ctx.body = quote;
    logger.info('Got quote', { fn: 'getQuote', quote_id: quote.id });
  } catch (err) {
    logger.error('Error getting quote', { fn: 'getQuote', quote_id: sayId, error: err });
    throw err;
  }
}

async function getRandomQuote(ctx) {
  logger.info('getRandomQuote called');

  try {
    const quote = (await Quote.getRandomQuote())[0];
    debug(quote);
    ctx.body = quote;
    logger.info('Got quote', { fn: 'getRandomQuote', quote_id: quote.id });
  } catch (err) {
    logger.error('Error getting random quote', { fn: 'getRandomQuote', error: err });
    throw err;
  }
}

module.exports = {
  getQuote,
  getRandomQuote,
};

