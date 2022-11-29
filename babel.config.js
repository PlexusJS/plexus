export default {
	presets: [
		['@babel/preset-env', { targets: { node: 'current' }, loose: false }],
		'@babel/preset-typescript',
		'@babel/preset-react'
	],
};