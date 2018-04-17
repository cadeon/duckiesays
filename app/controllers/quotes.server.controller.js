var config  = require('../../config/config');
var Quote    = require ('../models/quote.server.model');
var debug   = require('debug')('quotes');
var winston = require('winston');

var logger = new winston.Logger({transports : winston.loggers.options.transports});

exports.getQuote = getQuoteAsync;
exports.getRandomQuote = getRandomQuoteAsync;

async function getQuoteAsync(ctx, next) {
    debug('getAsync');
    debug(ctx.params.sayId)
    var id = ctx.params.sayId;
    logger.info('getQuoteAsync called',{quote_id: id});
  
    var quote = '';
    try {
        quote = (await Quote.getSingleQuote(id))[0];
    } catch (err) {
        logger.error('Error getting quote', {fn: 'getQuoteAsync', quote_id: id, error: err});
        throw(err);
    }
    debug(quote);
    ctx.body = quote;
    logger.info('Got quote', {fn: 'getQuoteAsync', quote_id: quote.id});
  }

async function getRandomQuoteAsync(ctx, next) {
  debug('getRandomQuoteAsync');
  logger.info('getRandomQuoteAsync called');

  var quote = '';
  try {
      quote = (await Quote.getRandomQuote())[0];
  } catch (err) {
      logger.error('Error getting random quote', {fn: 'getRandomQuoteAsync', error: err});
      throw(err);
  }
  debug(quote);
  ctx.body = quote;
  logger.info('Got quote', {fn: 'getRandomQuoteAsync', quote_id: quote.id});
  return;
}

