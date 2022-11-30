module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	rootDir: 'tests',
	transform: {
		'^.+\\.ts?$': 'ts-jest',
	},
	globals: {
		'ts-jest': {
			tsconfig: 'tsconfig.test.json',
		},
	},
}
