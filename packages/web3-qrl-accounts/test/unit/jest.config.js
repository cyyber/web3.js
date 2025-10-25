const base = require('../config/jest.config');

module.exports = {
	...base,
	// testMatch: ['<rootDir>/test/unit/**/*.(spec|test).(js|ts)'],
	testMatch: [
		'<rootDir>/test/unit/**/eip1559.test.ts',
		// '<rootDir>/test/unit/**/base.test.ts',
	],

	coverageDirectory: '../../.coverage/unit',
	collectCoverageFrom: ['src/**/*.ts'],
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
