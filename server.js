const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const send = require('koa-send');
const serve = require('koa-static');
const path = require('path');
const config = require('./config/config');
const winston = require('winston');
const multer = require('koa-multer');

const logger = winston.loggers.get('default');

const app = new Koa();

// JSON body parser — 2MB limit (resized images are ~200KB base64)
app.use(bodyParser({ enableTypes: ['json'], jsonLimit: '2mb' }));

// Multer for multipart file uploads (image field)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    },
});

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

require('./app/routes')(app, upload);

// Redirect ben.not-really.me to /ben
app.use(async (ctx, next) => {
    if (ctx.host === 'ben.not-really.me' || ctx.headers.host === 'ben.not-really.me') {
        if (ctx.path !== '/ben') {
            ctx.redirect('/ben');
            return;
        }
    }
    await next();
});

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
