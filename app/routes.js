var Mount = require('koa-mount');
var config = require('../config/config');

module.exports = function(app) {
  require('./routes/quotes.server.routes')(app);
};
