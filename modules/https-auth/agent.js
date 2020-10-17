// https://github.com/julie-ng/nodejs-certificate-auth/blob/master/client/agent.js

const https = require('https');
const fs = require('fs');
//const path = require('path');

// For more `https.Agent` options, see here:
// https://nodejs.org/api/https.html#https_https_request_options_callback

module.exports = function () {
	//const certFile = path.resolve('api-client-cert.pem');
	//const keyFile = path.resolve('api-client-key.pem');
	certFile = './modules/https-auth/api-client-cert.pem'
	keyFile = './modules/https-auth/api-client-key.pem'
	return new https.Agent({
		cert: fs.readFileSync(certFile),
		key: fs.readFileSync(keyFile),
		rejectUnauthorized: false
	});
};