const path = require('path');
const Knex = require('knex');

module.exports = Knex({
  client: 'sqlite3',
  connection: { filename: path.join(__dirname, '..', 'duckiedb.sqlite3') },
  useNullAsDefault: true,
});
