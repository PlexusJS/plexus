// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'PlexusJS Docs',
  tagline: 'Dinosaurs are cool',
  url: 'https://docs.plexusjs.org',
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
          editUrl: 'https://github.com/PlexusJS/plexus-docs/tree/master/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl:
            'https://github.com/PlexusJS/plexus-docs/tree/master/',
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
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: true,
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: '',
        logo: {
          alt: 'PlexusJS Logo',
          src: 'img/TransparentLogo.svg',
        },
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
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Resources',
            items: [
              {
                label: 'Documentation',
                to: '/docs/intro',
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
      },
    }),
};

module.exports = config;
