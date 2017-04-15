var config  = require('../../config/config');
var Quote    = require ('../models/quote.server.model');
var debug   = require('debug')('quotes');
var winston = require('winston');

var logger = new winston.Logger({transports : winston.loggers.options.transports});


exports.getQuote=function *(id, next) {
  debug('getQuote');
  debug('..id ' + id);
  logger.info('getQuote called',{quote_id: id});

  var quote = '';
  try {
      quote = (yield Quote.getSingleQuote(id))[0];
  } catch (err) {
      logger.error('Error getting quote', {fn: 'getQuote', quote_id: id, error: err});
      throw(err);
  }
  debug(quote);
  this.quote = quote;
  logger.info('Got quote', {fn: 'getQuote', quote_id: quote.id});
  yield next;
}

exports.readQuote = function *() {
  this.body = this.quote;
  return;
}

exports.getRandomQuote=function *() {
  debug('getRandomQuote');
  logger.info('getRandomQuote called');

  var quote = '';
  try {
      quote = (yield Quote.getRandomQuote())[0];
  } catch (err) {
      logger.error('Error getting random quote', {fn: 'getRandomQuote', error: err});
      throw(err);
  }
  debug(quote);
  this.body = quote;
  logger.info('Got quote', {fn: 'getRandomQuote', quote_id: quote.id});
  return;
}

