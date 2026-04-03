export default {
	transform: {
		'^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '../config/tsconfig.esm.json' }],
	},
};
