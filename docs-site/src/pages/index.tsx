import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

type FeatureItem = {
  title: string;
  description: string;
  link: string;
  linkLabel: string;
};

const FEATURES: FeatureItem[] = [
  {
    title: 'Deterministic VLP HTML & XML',
    description:
      'Generate light- and dark-mode safe VLP HTML5 snippets and complete content.xml + images/ ZIP packages with zero AI dependencies or external CDNs.',
    link: '/docs/creating-content/procedural-steps',
    linkLabel: 'Learn Step Authoring →',
  },
  {
    title: 'Smart Raw Text Converter',
    description:
      'Convert plain or numbered lab drafts into structured procedural steps without breaking multi-line paragraphs, backed by live syntax & error diagnostics.',
    link: '/docs/creating-content/raw-text-converter',
    linkLabel: 'Explore Raw Text Converter →',
  },
  {
    title: 'VLP Split-Screen & Student Exports',
    description:
      'Preview your manual at 1/3 taskbar width (360px), copy CKEditor-ready HTML, or export standalone PDF, HTML, MDX, and RTF student handouts.',
    link: '/docs/exporting/vlp-and-student-exports',
    linkLabel: 'View Export Workflows →',
  },
  {
    title: 'Multi-User Accounts & Offline MFA',
    description:
      'Built for up to 30 concurrent instructors with AES-256-GCM encrypted PII, isolated autosave workspaces, shared team manuals, and offline TOTP QR MFA.',
    link: '/docs/admin/accounts-mfa-sessions',
    linkLabel: 'Admin & Security Guide →',
  },
];

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/intro">
            Start Authoring Guide
          </Link>
          <Link
            className="button button--outline button--lg"
            style={{color: '#ffffff', borderColor: 'rgba(255,255,255,0.65)'}}
            to="/docs/installation">
            Docker Quick Start
          </Link>
        </div>
        <div className="vlp-badge-row">
          <span className="vlp-badge">v0.3.5-beta</span>
          <span className="vlp-badge">100% Air-Gapped</span>
          <span className="vlp-badge">Light &amp; VLP Dark Mode</span>
          <span className="vlp-badge">Zero External CDNs</span>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Step-by-step documentation for authoring VMware Lab Platform (VLP) lab manuals using VLP Manual HTML Formatter & XML Builder.">
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              {FEATURES.map((item) => (
                <div key={item.title} className="col col--6 margin-bottom--lg">
                  <div className="card padding--lg" style={{height: '100%'}}>
                    <Heading as="h3">{item.title}</Heading>
                    <p>{item.description}</p>
                    <Link to={item.link}>{item.linkLabel}</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
