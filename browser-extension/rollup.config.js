import typescript from '@rollup/plugin-typescript'

export default {
	input: 'src/main.js',
	output: {
		file: 'out/bin.js',
		format: 'es',
	},
	plugins: [typescript()],
}
