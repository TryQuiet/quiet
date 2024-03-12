import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Quiet',
  tagline: 'A private, p2p alternative to Slack and Discord',
  favicon: 'img/quiet_logo.png',

  // Set the production url of your site here
  url: 'https://your-docusaurus-site.example.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/quiet/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'TryQuiet',
  projectName: 'quiet',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-ideal-image',
      {
        quality: 70,
        max: 1030, // max resized image's size.
        min: 640, // min resized image's size. if original is lower, use that size.
        steps: 2, // the max number of images generated between min and max (inclusive)
        disableInDev: false,
      },
    ],
    // [
    //   'docusaurus-plugin-typedoc',

    //   // Plugin / TypeDoc options
    //   {
    //     entryPoints: ['../src/index.ts'],
    //     tsconfig: '../tsconfig.json',
    //   },
    // ],
    [
      '@grnet/docusaurus-terminology', 
      {
        termsDir: './docs/terms',
        docsDir: './docs/',
        glossaryFilepath: './docs/glossary.md'
      }
    ],
  ],

  themeConfig: {
    image: 'img/social-card.jpg',
    navbar: {
      title: 'Quiet',
      logo: {
        alt: 'Quiet Logo',
        src: 'img/quiet_logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/TryQuiet/quiet',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://tryquiet.org/',
          label: 'Website',
          position: 'right'
        }
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Overview',
              to: '/docs/overview',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Sprint Board',
              href: 'https://github.com/orgs/TryQuiet/projects/3/views/4?filterQuery=repo%3ATryQuiet%2Fquiet',
            },
            {
              label: 'Issues',
              href: 'https://github.com/TryQuiet/quiet/issues',
            },
            {
              label: 'Github Discussions',
              href: 'https://github.com/TryQuiet/quiet/discussions',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/facebook/docusaurus',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Quiet - Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
