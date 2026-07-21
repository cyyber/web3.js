const base = require('../config/jest.config');

module.exports = {
	...base,
	testMatch: ['<rootDir>/test/unit/**/*.(spec|test).(js|ts)'],

	coverageDirectory: '.coverage/unit',
	collectCoverageFrom: ['src/**'],
	coverageThreshold: {
		global: {
			statements: 83,
			branches: 76,
			functions: 89,
			lines: 83,
		},
	},
	collectCoverage: true,
	coverageReporters: [
		[
			'json',
			{
				file: 'web3-qrl-iban-unit-coverage.json',
			},
		],
	],
};
