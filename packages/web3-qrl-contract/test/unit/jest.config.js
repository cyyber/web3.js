const base = require('../config/jest.config');

module.exports = {
	...base,
	testMatch: ['<rootDir>/test/unit/**/*.(spec|test).(js|ts)'],

	coverageDirectory: '.coverage/unit',
	collectCoverageFrom: ['src/**'],
	coverageThreshold: {
		global: {
			statements: 86,
			branches: 78,
			functions: 86,
			lines: 86,
		},
	},
	collectCoverage: true,
	coverageReporters: [
		[
			'json',
			{
				file: 'web3-qrl-contract-unit-coverage.json',
			},
		],
	],
};
