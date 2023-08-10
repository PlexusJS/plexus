const { composePlugins, withNx } = require('@nx/webpack');
const { merge } = require('webpack-merge')

module.exports = composePlugins(withNx(), (config, { options, context }) => {
	// customize webpack config here
	return merge(config, {
		optimization: {
			sideEffects: true,
		},
	})
});