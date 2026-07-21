const base = require('../config/jest.config');

module.exports = {
	...base,
	testMatch: ['<rootDir>/test/unit/**/*.(spec|test).(js|ts)'],

	coverageDirectory: '.coverage/unit',
	collectCoverageFrom: ['src/**'],
	coverageThreshold: {
		global: {
			statements: 84,
			branches: 72,
			functions: 84,
			lines: 84,
		},
	},
	collectCoverage: true,
	coverageReporters: [
		[
			'json',
			{
				file: 'web3-core-unit-coverage.json',
			},
		],
	],
};
