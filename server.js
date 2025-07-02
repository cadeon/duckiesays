const Koa = require('koa');
const send = require('koa-send');
const serve = require('koa-static');
const config = require('./config/config');
const winston = require('winston');

const logger = winston.createLogger({ transports: winston.loggers.options.transports });

const app = new Koa();

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      error: {
        code: ctx.status,
        message: err.message,
      },
    };
  }
});

app.keys = [config.secret];

require('./app/routes')(app);

app.use(async (ctx, next) => {
  const img = ctx.url.match(/\/img\/*/);
  if (ctx.url === '/' || img) {
    await next();
  } else {
    await send(ctx, './public/index.html');
  }
});

app.use(serve('public'));

logger.info('Server started');

const server = app.listen(config.port);
module.exports = server; // support unit test

console.log(`${process.env.NODE_ENV} server running at http://localhost:${config.port}`);
