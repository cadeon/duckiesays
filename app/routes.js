const Router = require('koa-router');
const send = require('koa-send');
const path = require('path');
const thinksRouter = require('./routes/thinks.server.routes');

module.exports = function (app, upload) {
    app.use(thinksRouter.routes());
    app.use(thinksRouter.allowedMethods());

    // Ben's page
    const benRouter = new Router();
    benRouter.get('/ben', async (ctx) => {
        await send(ctx, 'ben.html', { root: path.join(__dirname, '../public') });
    });
    app.use(benRouter.routes());
};
