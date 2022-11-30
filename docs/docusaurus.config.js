// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github')
const darkCodeTheme = require('prism-react-renderer/themes/dracula')

/** @type {import('@docusaurus/types').Config} */
const config = {
	title: 'PlexusJS Docs',
	tagline:
		'The ultimate toolkit for orchestrating data in reactive web applications!',
	url: 'https://plexusjs.org',
	baseUrl: '/',
	onBrokenLinks: 'throw',
	onBrokenMarkdownLinks: 'warn',
	favicon: 'img/favicon.ico',
	organizationName: 'Plexus', // Usually your GitHub org/user name.
	projectName: 'PlexusJS', // Usually your repo name.

	presets: [
		[
			'classic',
			/** @type {import('@docusaurus/preset-classic').Options} */
			({
				docs: {
					sidebarPath: require.resolve('./sidebars.js'),
					// Please change this to your repo.
					editUrl: 'https://github.com/PlexusJS/plexus/tree/master/',
				},
				blog: {
					showReadingTime: true,
					// Please change this to your repo.
					editUrl: 'https://github.com/PlexusJS/plexus/tree/master/',
				},
				theme: {
					customCss: require.resolve('./src/css/custom.css'),
				},
			}),
		],
	],

	themeConfig:
		/** @type {import('@docusaurus/preset-classic').ThemeConfig} */
		({
			metadata: [
				{
					name: 'keywords',
					content:
						'plexusjs, plexus, state management, state, management, npm, node, nodejs, http-client, http, client',
				},
			],
			image: 'img/OriginalLogo.png',
			colorMode: {
				defaultMode: 'dark',
				disableSwitch: true,
				respectPrefersColorScheme: false,
			},
			navbar: {
				title: '',
				logo: {
					alt: 'PlexusJS Logo',
					src: 'img/TransparentLogo_thin.svg ',
				},
				hideOnScroll: true,
				items: [
					{
						type: 'doc',
						docId: 'intro',
						position: 'left',
						label: 'Docs',
					},
					{ to: '/blog', label: 'Blog', position: 'left' },
					{
						href: 'https://github.com/PlexusJS/plexus',
						label: 'GitHub',
						position: 'right',
					},
					{
						label: 'Discord',
						position: 'right',
						href: 'https://discord.gg/kWJ2kVnykH',
					},
				],
			},
			footer: {
				style: 'dark',
				logo: {
					alt: 'Powered By Vercel',
					src: 'https://www.datocms-assets.com/31049/1618983297-powered-by-vercel.svg',
					href: 'https://vercel.com?utm_source=plexusjs&utm_campaign=oss',
				},
				links: [
					{
						title: 'Resources',
						items: [
							{
								label: 'Documentation',
								to: '/docs',
							},
							{
								label: 'Blog',
								to: '/blog',
							},
							{
								label: 'GitHub',
								href: 'https://github.com/PlexusJS/plexus',
							},
						],
					},
					{
						title: 'Community',
						items: [
							{
								label: 'Discord',
								href: 'https://discord.gg/kWJ2kVnykH',
							},
							{
								label: 'Twitter',
								href: 'https://twitter.com/plexusjs',
							},
						],
					},
				],
				copyright: `Copyright © ${new Date().getFullYear()} PlexusJS. All rights reserved.`,
			},
			prism: {
				theme: lightCodeTheme,
				darkTheme: darkCodeTheme,
				defaultLanguage: 'typescript',
				additionalLanguages: ['powershell', 'bash'],
			},
		}),
}

module.exports = config
