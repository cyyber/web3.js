const base = require('../config/jest.config');

module.exports = {
	...base,
	testMatch: ['<rootDir>/test/unit/**/*.(spec|test).(js|ts)'],

	coverageDirectory: '.coverage/unit',
	collectCoverageFrom: ['src/**/*.ts'],
	coverageThreshold: {
		global: {
			statements: 81,
			branches: 64,
			functions: 80,
			lines: 80,
		},
	},
	collectCoverage: true,
	coverageReporters: [
		[
			'json',
			{
				file: 'web3-qrl-accounts-unit-coverage.json',
			},
		],
	],
};
