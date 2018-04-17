var Koa = require('koa');
var Router = require('koa-router');
var send   = require('koa-send');
var serve  = require('koa-static-server');
var config = require('./config/config');
var convert = require('koa-convert');
var dbConfig = require('./config/knex');

var winston = require('winston');
var logger = new winston.Logger({transports : winston.loggers.options.transports});

var app = new Koa();

app.use(require('koa-error')());
app.use(convert(function *(next) {
    try{
      yield next;
    }
    catch (err) {
      this.status = err.status || 500;
      this.body = {'error':{
        code:this.status,
        message:err.message
      }};
    }
  }));

app.keys = [config.secret];


require('./app/routes')(app);

 app.use(convert( function *(next) {
    const img = this.url.match(/\/img\/*/);
    if (this. url === '/' || img ) {
        yield next;
    } else {
        yield send(this, './public/index.html');
    };
})); 

app.use(serve({rootDir: 'public'}));

logger.info('Server started');

var server = app.listen(config.port);
module.exports = app;
module.exports = server; // support unit test

console.log(process.env.NODE_ENV + ' server running at http://localhost:' + config.port);
