import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'VLP Manual Generator Docs',
  tagline: 'Authoring Guide for Air-Gapped VMware Lab Platform (VLP) Manuals & XML Packages',
  favicon: 'img/vlp-logo.svg',

  future: {
    v4: true,
  },

  url: 'https://balbyyo.github.io',
  baseUrl: '/VLP-manual-generator/',

  organizationName: 'BalbyyO',
  projectName: 'VLP-manual-generator',

  onBrokenLinks: 'throw',

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
            'https://github.com/BalbyyO/VLP-manual-generator/tree/main/docs-site/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/screenshots/03-workspace-dark-overview.png',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'VLP Manual Generator',
      logo: {
        alt: 'VLP Manual Generator Logo',
        src: 'img/vlp-logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'guideSidebar',
          position: 'left',
          label: 'User Guide',
        },
        {
          to: '/docs/creating-content/procedural-steps',
          label: 'Creating Steps',
          position: 'left',
        },
        {
          to: '/docs/exporting/vlp-and-student-exports',
          label: 'Exporting',
          position: 'left',
        },
        {
          href: 'https://github.com/BalbyyO/VLP-manual-generator',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Getting Started',
          items: [
            {label: 'Introduction', to: '/docs/intro'},
            {label: 'Installation & Air-Gapped Docker', to: '/docs/installation'},
            {label: 'Studio Workspace Tour', to: '/docs/workspace-tour'},
          ],
        },
        {
          title: 'Content Authoring',
          items: [
            {label: 'Course Overviews & VM Creds', to: '/docs/creating-content/course-overview'},
            {label: 'Procedural Steps & Formatting', to: '/docs/creating-content/procedural-steps'},
            {label: 'Raw Text to Steps Converter', to: '/docs/creating-content/raw-text-converter'},
            {label: 'Legacy XML & Chapter Consolidation', to: '/docs/creating-content/legacy-xml-consolidation'},
          ],
        },
        {
          title: 'Delivery & Admin',
          items: [
            {label: 'Exporting for VLP & Students', to: '/docs/exporting/vlp-and-student-exports'},
            {label: 'Accounts, MFA & Admin Panel', to: '/docs/admin/accounts-mfa-sessions'},
            {label: 'GitHub Repository', href: 'https://github.com/BalbyyO/VLP-manual-generator'},
            {label: 'Report an Issue', href: 'https://github.com/BalbyyO/VLP-manual-generator/issues/new'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} VLP Manual HTML Formatter & XML Builder (v0.3.5-beta). Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'yaml', 'markup', 'powershell'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
