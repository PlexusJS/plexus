module.exports = {
	presets: [
		['@babel/preset-env', { targets: { node: 'current' } }],
		'@babel/preset-typescript',
		'@babel/preset-env', '@babel/preset-react'
	],
};