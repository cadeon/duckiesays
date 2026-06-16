const thinksRouter = require('./routes/thinks.server.routes');

module.exports = function (app, upload) {
    app.use(thinksRouter.routes());
    app.use(thinksRouter.allowedMethods());
};
