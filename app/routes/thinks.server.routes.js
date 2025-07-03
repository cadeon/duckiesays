const thinks = require('../../app/controllers/thinks.server.controller');
const Router = require('koa-router');

const router = new Router();
const apiversion = '/api/v2';

router.post(`${apiversion}/thinks`, thinks.getResponse);

module.exports = router;
