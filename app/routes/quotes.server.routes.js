var config = require('../../config/config');
var quotes = require('../../app/controllers/quotes.server.controller');
var Router = require('koa-router');


module.exports = function(app) {
  var router = new Router();
	var apiversion = '/api/'+ config.apiVersion;

	router.get(apiversion + '/says/:sayId',  quotes.getQuote);
	router.get(apiversion + '/says',  quotes.getRandomQuote);

	app.use(router.routes());
	app.use(router.allowedMethods());	
};
