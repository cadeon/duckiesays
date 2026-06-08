const Quote = require('../models/quote.server.model');
const winston = require('winston');

const logger = winston.loggers.get('default');

async function getQuote(ctx) {
	const { sayId } = ctx.params;
	logger.info('getQuote called', { quote_id: sayId });

	try {
		if (!Number.isInteger(Number(sayId)) || Number(sayId) <= 0) {
			ctx.status = 400;
			ctx.body = { error: 'Invalid quote ID.' };
			return;
		}
		const quote = (await Quote.getSingleQuote(Number(sayId)))[0];
		if (!quote) {
			ctx.status = 404;
			ctx.body = { error: 'Quote not found.' };
			return;
		}
		logger.info('Got quote', { fn: 'getQuote', quote_id: quote.id });
		ctx.body = quote;
	} catch (err) {
		logger.error('Error getting quote', { fn: 'getQuote', quote_id: sayId, error: err.message });
		throw err;
	}
}

async function getRandomQuote(ctx) {
	logger.info('getRandomQuote called');

	try {
		const quote = (await Quote.getRandomQuote())[0];
		if (!quote) {
			ctx.status = 404;
			ctx.body = { error: 'No quotes available.' };
			return;
		}
		logger.info('Got quote', { fn: 'getRandomQuote', quote_id: quote.id });
		ctx.body = quote;
	} catch (err) {
		logger.error('Error getting random quote', { fn: 'getRandomQuote', error: err.message });
		throw err;
	}
}

module.exports = {
	getQuote,
	getRandomQuote,
};
