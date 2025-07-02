const quotesRouter = require('./routes/quotes.server.routes');

module.exports = function (app) {
  app.use(quotesRouter.routes());
  app.use(quotesRouter.allowedMethods());
};
