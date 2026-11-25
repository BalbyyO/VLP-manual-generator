import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  guideSidebar: [
    'intro',
    'installation',
    'workspace-tour',
    {
      type: 'category',
      label: 'Creating Lab Content',
      collapsed: false,
      items: [
        'creating-content/course-overview',
        'creating-content/procedural-steps',
        'creating-content/raw-text-converter',
        'creating-content/legacy-xml-consolidation',
      ],
    },
    {
      type: 'category',
      label: 'Exporting & Publishing',
      collapsed: false,
      items: ['exporting/vlp-and-student-exports'],
    },
    {
      type: 'category',
      label: 'Multi-User & Administration',
      collapsed: false,
      items: ['admin/accounts-mfa-sessions'],
    },
  ],
};

export default sidebars;
