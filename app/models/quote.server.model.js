const knex = require('../../config/knex');
const debug = require('debug')('quote.model');

const getSingleQuote = (id) => {
  debug('getSingleQuote');
  return knex('quotes').select().where('id', id);
};

const getRandomQuote = () => {
  debug('getRandomQuote');
  return knex('quotes').select().orderByRaw('RANDOM()').limit(1);
};

module.exports = {
  getSingleQuote,
  getRandomQuote,
};





