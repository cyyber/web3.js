module.exports = {
	transform: {
		'^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '../config/tsconfig.cjs.json' }],
	},
};
