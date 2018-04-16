var knex = require('../../config/knex');
var debug = require('debug')('quote.model');


exports.getSingleQuote = function(id) {
  debug('getSingleQuote')
  return knex('quotes').select().where('id', id);
};

exports.getRandomQuote = function() {
  debug('getRandomQuote')
  return knex('quotes').select().orderByRaw('RANDOM()').limit(1);
};





