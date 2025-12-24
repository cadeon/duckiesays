const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const send = require('koa-send');
const serve = require('koa-static');
const config = require('./config/config');
const winston = require('winston');

const logger = winston.loggers.get('default');

// Helper function to get real IP address when behind proxy
function getClientIP(ctx) {
  // Check for X-Forwarded-For header (common with proxies)
  const xff = ctx.get('X-Forwarded-For');
  if (xff) {
    // X-Forwarded-For can contain multiple IPs, we want the original client
    return xff.split(',')[0].trim();
  }
  
  // Check for X-Real-IP header
  const xreal = ctx.get('X-Real-IP');
  if (xreal) {
    return xreal;
  }
  
  // Fallback to Koa's built-in IP property
  return ctx.ip || ctx.request.ip || 'unknown';
}

// Access logging middleware with IP tracking
const accessLogger = async (ctx, next) => {
  const start = Date.now();
  
  await next();
  
  const ms = Date.now() - start;
  // Get client IP address reliably
  const ip = getClientIP(ctx);
  
  logger.info('access', {
    method: ctx.method,
    url: ctx.url,
    status: ctx.status,
    responseTime: `${ms}ms`,
    ip: ip
  });
};

const app = new Koa();
app.use(accessLogger);
app.use(bodyParser());

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

console.log(`server running at http://localhost:${config.port}`);
