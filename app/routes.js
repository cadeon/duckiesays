//var Mount = require('koa-mount');
var config = require('../config/config');

module.exports = function(app) {
  console.log('1');
  require('./routes/quotes.server.routes')(app);
  console.log('11');
};
