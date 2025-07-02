const quotes = require('../../app/controllers/quotes.server.controller');
const Router = require('koa-router');

const router = new Router();
const apiversion = '/api/v2';

router.get(`${apiversion}/says/:sayId`, quotes.getQuote);
router.get(`${apiversion}/says`, quotes.getRandomQuote);

module.exports = router;
