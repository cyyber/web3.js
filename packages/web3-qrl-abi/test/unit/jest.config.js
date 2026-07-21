const base = require('../config/jest.config');

module.exports = {
	...base,
	testMatch: ['<rootDir>/test/unit/**/*.(spec|test).(js|ts)'],

	coverageDirectory: '.coverage/unit',
	collectCoverageFrom: ['src/**'],
	coverageThreshold: {
		global: {
			statements: 95,
			branches: 82,
			functions: 95,
			lines: 94,
		},
	},
	collectCoverage: true,
	coverageReporters: [
		[
			'json',
			{
				file: 'web3-qrl-abi-unit-coverage.json',
			},
		],
	],
};
