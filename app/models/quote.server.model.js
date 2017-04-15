var knex = require('../../config/knex');
var debug = require('debug')('quote.model');


exports.getSingleQuote = function(id) {
  return knex('quotes').select().where('id', id);
};

exports.getRandomQuote = function() {
  return knex('quotes').select().orderByRaw('RANDOM()').limit(1);
};





