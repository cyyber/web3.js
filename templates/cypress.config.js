/*
This file is part of web3.js.

web3.js is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

web3.js is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
*/
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// Directory that holds the throwaway TLS fixture used by the Firefox engine.
// It is git-ignored: no private key is ever committed with this template. The
// cert/key are generated on demand (see ensureEphemeralCert) so every run uses
// a fresh, self-signed, short-lived pair scoped to the test host only.
const certDir = path.join(__dirname, 'cypress', '.cert');
const certPath = path.join(certDir, 'cert.pem');
const keyPath = path.join(certDir, 'key.pem');

// Generate a fresh, self-signed cert/key pair for local Firefox system tests if
// one is not already present. Requires `openssl`, which ships with the Firefox
// test toolchain. The pair is disposable and must not be committed.
function ensureEphemeralCert() {
	if (fs.existsSync(certPath) && fs.existsSync(keyPath)) return;

	fs.mkdirSync(certDir, { recursive: true });
	execFileSync(
		'openssl',
		[
			'req',
			'-x509',
			'-newkey',
			'rsa:2048',
			'-nodes',
			'-days',
			'7',
			'-subj',
			'/O=web3.js system tests/CN=web3.js',
			'-addext',
			'subjectAltName=DNS:web3.js',
			'-keyout',
			keyPath,
			'-out',
			certPath,
		],
		{ stdio: 'ignore' },
	);
}

const config = {
	screenshotOnRunFailure: false,
	video: false,
	e2e: {
		// We've imported your old cypress plugins here.
		// You may want to clean this up later by importing these.
		setupNodeEvents(on, config) {
			return require('./cypress/plugins/index.js')(on, config);
		},
		specPattern: 'test/integration/**/**/*.test.ts',
		excludeSpecPattern: ['**/contract_defaults_extra.test.ts'],
	},
};

if (process.env.WEB3_SYSTEM_TEST_ENGINE === 'firefox') {
	ensureEphemeralCert();
	const port = parseInt(String(Math.random() * 10000 + 10000));
	config.clientCertificates = [
		{
			url: 'https://web3.js',
			certs: [
				{
					cert: './cypress/.cert/cert.pem',
					key: './cypress/.cert/key.pem',
				},
			],
		},
	];
	config.e2e.port = port;
	config.e2e.hosts = {
		'web3.js': '127.0.0.1',
	};
	config.e2e.baseUrl = `https://web3.js:${port}`;
}
module.exports = config;
