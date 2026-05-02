module.exports = {
	rootDir: '../..',
	testMatch: ['<rootDir>/test/**/?(*.)+(spec|test).+(ts|tsx|js)'],
	setupFilesAfterEnv: ['<rootDir>/test/config/setup.js'],
	transform: {
		'^.+\\.(ts|tsx)$': [
			'ts-jest',
			{
				tsconfig: './test/tsconfig.json',
				// ts-jest in this repo doesn't reliably propagate the `target`
				// option through tsconfig `extends` chains, so it picks up
				// es2016 from the root base and rejects BigInt exponentiation
				// (`2n ** 256n`) in src/validation/numbers.ts with TS2791.
				// `tsc --noEmit -p test/tsconfig.json` passes cleanly because
				// it does honor the override; only ts-jest's resolver doesn't.
				// Skip type-checking inside ts-jest (transpileOnly) so the
				// runtime can still execute the source — Node 18+ supports
				// BigInt ** natively. Type safety is still enforced by the
				// standalone build (yarn build) and by editor tsserver.
				isolatedModules: true,
			},
		],
	},
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
	verbose: false,
	collectCoverage: false,
	coverageReporters: ['json'],
	coverageDirectory: '.coverage',
	/**
	 * restoreMocks [boolean]
	 *
	 * Default: false
	 *
	 * Automatically restore mock state between every test.
	 * Equivalent to calling jest.restoreAllMocks() between each test.
	 * This will lead to any mocks having their fake implementations removed
	 * and restores their initial implementation.
	 */
	restoreMocks: true,

	/**
	 * resetModules [boolean]
	 *
	 * Default: false
	 *
	 * By default, each test file gets its own independent module registry.
	 * Enabling resetModules goes a step further and resets the module registry before running each individual test.
	 * This is useful to isolate modules for every test so that local module state doesn't conflict between tests.
	 * This can be done programmatically using jest.resetModules().
	 */
	resetModules: true,
};
