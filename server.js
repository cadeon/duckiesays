const Koa = require('koa');
const send = require('koa-send');
const serve = require('koa-static');
const path = require('path');
const config = require('./config/config');
const winston = require('winston');

const logger = winston.loggers.get('default');

const app = new Koa();

app.use(async (ctx, next) => {
	try {
		await next();
	} catch (err) {
		const status = err.status || 500;
		ctx.status = status;
		logger.error('Request error', { status, message: err.message, stack: err.stack });
		ctx.body = {
			error: {
				code: status,
				message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
			},
		};
	}
});

require('./app/routes')(app);

const publicDir = path.join(__dirname, 'public');

app.use(async (ctx, next) => {
	if (ctx.url === '/' || /^\/img\//.test(ctx.url)) {
		await next();
	} else {
		await send(ctx, 'index.html', { root: publicDir });
	}
});

app.use(serve(publicDir, { index: 'index.html' }));

logger.info('Server started');

const server = app.listen(config.port);
module.exports = server; // support unit test

console.log(`server running at http://localhost:${config.port}`);
