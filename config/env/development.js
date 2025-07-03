const port = 7007;
module.exports = {
	port,
	apiVersion: 'v2',
	olla: {
		apiUrl: 'http://localhost:11434/api/generate',
		model: 'smollm2:135m',
		temperature: 0.8,
		max_tokens: 100,
	},
};
