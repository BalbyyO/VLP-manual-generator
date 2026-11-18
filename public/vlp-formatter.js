(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VLPFormatter = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* =========================================================================
   * Curated Color Themes (Inspired by Figma Color Combinations Library)
   * ========================================================================= */
  const VLP_COLOR_THEMES = [
    {
      id: 'crimson-slate',
      name: 'Crimson & Slate (Default VLP Red)',
      swatch: '#dc2626',
      light: {
        accent: '#dc2626',
        accentHover: '#ef4444',
        cardBg: 'rgba(220, 38, 38, 0.08)',
        cardBorder: 'rgba(239, 68, 68, 0.4)',
        contextBg: 'rgba(220, 38, 38, 0.10)',
        contextText: '#7f1d1d',
        thBg: 'rgba(128, 128, 128, 0.15)',
        rowEven: 'rgba(128, 128, 128, 0.06)',
        appSoft: 'rgba(220, 38, 38, 0.14)'
      },
      dark: {
        accent: '#ef4444',
        cardBg: 'rgba(239, 68, 68, 0.14)',
        cardBorder: 'rgba(239, 68, 68, 0.45)',
        contextBg: 'rgba(239, 68, 68, 0.16)',
        contextText: '#fecaca'
      },
      cmd: {
        bg: '#0f172a',
        text: '#38bdf8',
        border: '#334155',
        prompt: '#4ade80'
      }
    },
    {
      id: 'cobalt-sky',
      name: 'Cobalt & Electric Sky',
      swatch: '#2563eb',
      light: {
        accent: '#2563eb',
        accentHover: '#3b82f6',
        cardBg: 'rgba(37, 99, 235, 0.08)',
        cardBorder: 'rgba(59, 130, 246, 0.42)',
        contextBg: 'rgba(37, 99, 235, 0.10)',
        contextText: '#1e3a8a',
        thBg: 'rgba(37, 99, 235, 0.13)',
        rowEven: 'rgba(37, 99, 235, 0.05)',
        appSoft: 'rgba(37, 99, 235, 0.16)'
      },
      dark: {
        accent: '#60a5fa',
        cardBg: 'rgba(59, 130, 246, 0.14)',
        cardBorder: 'rgba(96, 165, 250, 0.45)',
        contextBg: 'rgba(59, 130, 246, 0.17)',
        contextText: '#bfdbfe'
      },
      cmd: {
        bg: '#0f172a',
        text: '#38bdf8',
        border: '#1e3a5f',
        prompt: '#4ade80'
      }
    },
    {
      id: 'emerald-mint',
      name: 'Emerald & Mint',
      swatch: '#059669',
      light: {
        accent: '#059669',
        accentHover: '#10b981',
        cardBg: 'rgba(5, 150, 105, 0.08)',
        cardBorder: 'rgba(16, 185, 129, 0.42)',
        contextBg: 'rgba(5, 150, 105, 0.11)',
        contextText: '#064e3b',
        thBg: 'rgba(5, 150, 105, 0.13)',
        rowEven: 'rgba(5, 150, 105, 0.05)',
        appSoft: 'rgba(5, 150, 105, 0.16)'
      },
      dark: {
        accent: '#34d399',
        cardBg: 'rgba(16, 185, 129, 0.14)',
        cardBorder: 'rgba(52, 211, 153, 0.45)',
        contextBg: 'rgba(16, 185, 129, 0.16)',
        contextText: '#a7f3d0'
      },
      cmd: {
        bg: '#06281e',
        text: '#6ee7b7',
        border: '#065f46',
        prompt: '#38bdf8'
      }
    },
    {
      id: 'royal-violet',
      name: 'Royal Indigo & Violet',
      swatch: '#7c3aed',
      light: {
        accent: '#7c3aed',
        accentHover: '#8b5cf6',
        cardBg: 'rgba(124, 58, 237, 0.08)',
        cardBorder: 'rgba(139, 92, 246, 0.42)',
        contextBg: 'rgba(124, 58, 237, 0.11)',
        contextText: '#4c1d95',
        thBg: 'rgba(124, 58, 237, 0.13)',
        rowEven: 'rgba(124, 58, 237, 0.05)',
        appSoft: 'rgba(124, 58, 237, 0.16)'
      },
      dark: {
        accent: '#a78bfa',
        cardBg: 'rgba(139, 92, 246, 0.14)',
        cardBorder: 'rgba(167, 139, 250, 0.45)',
        contextBg: 'rgba(139, 92, 246, 0.17)',
        contextText: '#ddd6fe'
      },
      cmd: {
        bg: '#1e1b4b',
        text: '#c4b5fd',
        border: '#4338ca',
        prompt: '#4ade80'
      }
    },
    {
      id: 'amber-obsidian',
      name: 'Amber Gold & Obsidian',
      swatch: '#d97706',
      light: {
        accent: '#d97706',
        accentHover: '#f59e0b',
        cardBg: 'rgba(217, 119, 6, 0.09)',
        cardBorder: 'rgba(245, 158, 11, 0.45)',
        contextBg: 'rgba(217, 119, 6, 0.12)',
        contextText: '#78350f',
        thBg: 'rgba(217, 119, 6, 0.13)',
        rowEven: 'rgba(217, 119, 6, 0.05)',
        appSoft: 'rgba(217, 119, 6, 0.16)'
      },
      dark: {
        accent: '#fbbf24',
        cardBg: 'rgba(245, 158, 11, 0.14)',
        cardBorder: 'rgba(251, 191, 36, 0.45)',
        contextBg: 'rgba(245, 158, 11, 0.17)',
        contextText: '#fde68a'
      },
      cmd: {
        bg: '#1c1917',
        text: '#fcd34d',
        border: '#44403c',
        prompt: '#4ade80'
      }
    },
    {
      id: 'teal-coral',
      name: 'Teal & Coral',
      swatch: '#0d9488',
      light: {
        accent: '#0d9488',
        accentHover: '#14b8a6',
        cardBg: 'rgba(13, 148, 136, 0.08)',
        cardBorder: 'rgba(20, 184, 166, 0.42)',
        contextBg: 'rgba(13, 148, 136, 0.11)',
        contextText: '#134e4a',
        thBg: 'rgba(13, 148, 136, 0.13)',
        rowEven: 'rgba(13, 148, 136, 0.05)',
        appSoft: 'rgba(13, 148, 136, 0.16)'
      },
      dark: {
        accent: '#2dd4bf',
        cardBg: 'rgba(20, 184, 166, 0.14)',
        cardBorder: 'rgba(45, 212, 191, 0.45)',
        contextBg: 'rgba(20, 184, 166, 0.17)',
        contextText: '#99f6e4'
      },
      cmd: {
        bg: '#0f172a',
        text: '#5eead4',
        border: '#115e59',
        prompt: '#fb7185'
      }
    },
    {
      id: 'rose-burgundy',
      name: 'Rose & Burgundy',
      swatch: '#e11d48',
      light: {
        accent: '#e11d48',
        accentHover: '#f43f5e',
        cardBg: 'rgba(225, 29, 72, 0.08)',
        cardBorder: 'rgba(244, 63, 94, 0.42)',
        contextBg: 'rgba(225, 29, 72, 0.11)',
        contextText: '#881337',
        thBg: 'rgba(225, 29, 72, 0.12)',
        rowEven: 'rgba(225, 29, 72, 0.05)',
        appSoft: 'rgba(225, 29, 72, 0.16)'
      },
      dark: {
        accent: '#fb7185',
        cardBg: 'rgba(244, 63, 94, 0.14)',
        cardBorder: 'rgba(251, 113, 133, 0.45)',
        contextBg: 'rgba(244, 63, 94, 0.17)',
        contextText: '#fecdd3'
      },
      cmd: {
        bg: '#1f1218',
        text: '#fda4af',
        border: '#4c1d2e',
        prompt: '#4ade80'
      }
    },
    {
      id: 'cyber-cyan',
      name: 'Cyber Cyan & Neon Slate',
      swatch: '#0284c7',
      light: {
        accent: '#0284c7',
        accentHover: '#0ea5e9',
        cardBg: 'rgba(2, 132, 199, 0.08)',
        cardBorder: 'rgba(14, 165, 233, 0.42)',
        contextBg: 'rgba(2, 132, 199, 0.11)',
        contextText: '#0c4a6e',
        thBg: 'rgba(2, 132, 199, 0.13)',
        rowEven: 'rgba(2, 132, 199, 0.05)',
        appSoft: 'rgba(2, 132, 199, 0.16)'
      },
      dark: {
        accent: '#38bdf8',
        cardBg: 'rgba(14, 165, 233, 0.14)',
        cardBorder: 'rgba(56, 189, 248, 0.45)',
        contextBg: 'rgba(14, 165, 233, 0.17)',
        contextText: '#bae6fd'
      },
      cmd: {
        bg: '#090d16',
        text: '#7dd3fc',
        border: '#1e3a5f',
        prompt: '#4ade80'
      }
    }
  ];

  function getColorThemes() {
    return VLP_COLOR_THEMES;
  }

  function getColorTheme(themeId) {
    return VLP_COLOR_THEMES.find(function (t) { return t.id === themeId; }) || VLP_COLOR_THEMES[0];
  }

  function inferColorThemeFromHtml(html) {
    const m = String(html || '').match(/--vlp-accent-red:\s*([^;}\s]+)/i);
    if (!m) return 'crimson-slate';
    const val = m[1].toLowerCase();
    const found = VLP_COLOR_THEMES.find(function (t) {
      return t.light.accent.toLowerCase() === val || t.dark.accent.toLowerCase() === val;
    });
    return found ? found.id : 'crimson-slate';
  }

  function getMasterStyleBlock(themeId) {
    const t = getColorTheme(themeId);
    return `<style>
  :root {
    --vlp-border: rgba(128, 128, 128, 0.3);
    --vlp-accent-red: ${t.light.accent};
    --vlp-card-bg: ${t.light.cardBg};
    --vlp-card-border: ${t.light.cardBorder};
    --vlp-th-bg: ${t.light.thBg};
    --vlp-row-even: ${t.light.rowEven};
    --vlp-kbd-bg: rgba(128, 128, 128, 0.15);
    --vlp-kbd-border: rgba(128, 128, 128, 0.35);
    --vlp-context-bg: ${t.light.contextBg};
    --vlp-context-text: ${t.light.contextText};
    --vlp-cmd-bg: ${t.cmd.bg};
    --vlp-cmd-text: ${t.cmd.text};
    --vlp-cmd-border: ${t.cmd.border};
    --vlp-prompt: ${t.cmd.prompt};
  }

  @media (prefers-color-scheme: dark) {
    :root:not(.theme-light):not(.light-theme):not([data-theme="light"]):not([clr-theme="light"]):not([cds-theme="light"]) {
      --vlp-accent-red: ${t.dark.accent};
      --vlp-card-bg: ${t.dark.cardBg};
      --vlp-card-border: ${t.dark.cardBorder};
      --vlp-context-bg: ${t.dark.contextBg};
      --vlp-context-text: ${t.dark.contextText};
    }
  }

  .theme-light,
  .light-theme,
  [data-theme="light"],
  [clr-theme="light"],
  [cds-theme="light"] {
    --vlp-accent-red: ${t.light.accent};
    --vlp-card-bg: ${t.light.cardBg};
    --vlp-card-border: ${t.light.cardBorder};
    --vlp-context-bg: ${t.light.contextBg};
    --vlp-context-text: ${t.light.contextText};
  }

  .dark,
  [data-theme="dark"],
  [clr-theme="dark"],
  [cds-theme="dark"],
  .theme-dark,
  .dark-theme,
  .clr-theme-dark,
  body.theme-dark {
    --vlp-accent-red: ${t.dark.accent};
    --vlp-card-bg: ${t.dark.cardBg};
    --vlp-card-border: ${t.dark.cardBorder};
    --vlp-context-bg: ${t.dark.contextBg};
    --vlp-context-text: ${t.dark.contextText};
  }

  .course-overview,
  .lab-wrapper,
  .course-overview *,
  .lab-wrapper * {
    box-sizing: border-box;
  }

  .course-overview,
  .lab-wrapper {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: inherit !important;
    line-height: 1.65;
    font-size: 15px;
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    container-type: inline-size;
    container-name: vlp-manual;
    overflow-wrap: anywhere;
    word-wrap: break-word;
  }

  .course-overview p,
  .lab-wrapper p {
    color: inherit !important;
  }

  .course-overview ul,
  .course-overview ol,
  .lab-wrapper ul,
  .lab-wrapper ol {
    background: transparent !important;
    background-color: transparent !important;
    color: inherit !important;
    margin: 6px 0 !important;
    padding-left: 22px !important;
  }

  .course-overview li,
  .lab-wrapper li {
    background: transparent !important;
    background-color: transparent !important;
    color: inherit !important;
    margin-bottom: 4px;
  }

  .course-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .course-header h1 {
    font-size: 2rem;
    font-weight: 800;
    color: var(--vlp-accent-red) !important;
    margin: 0 0 1rem 0;
    letter-spacing: -0.025em;
  }

  .banner-container {
    text-align: center;
    margin: 1.25rem 0 1.75rem 0;
  }

  .banner-img {
    margin: 0 auto;
    border-radius: 8px;
    border: 1px solid var(--vlp-border);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  }

  .section-divider {
    border: 0;
    height: 1px;
    background-color: var(--vlp-border);
    margin: 2rem 0 1.5rem 0;
  }

  .lab-header {
    border-left: 4px solid var(--vlp-accent-red);
    padding-left: 12px;
    margin-bottom: 1rem;
  }

  .lab-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--vlp-accent-red) !important;
  }

  /* Callout Boxes: Instructional Purpose and Target VM Credentials */
  .purpose-card,
  .lab-note {
    background-color: var(--vlp-card-bg) !important;
    border: 1px solid var(--vlp-card-border) !important;
    border-left: 5px solid var(--vlp-accent-red) !important;
    border-radius: 6px;
    padding: 1.15rem 1.35rem;
    margin: 1.25rem 0;
    color: inherit !important;
  }

  .lab-table td .lab-note {
    margin: 10px 0 4px 0;
    padding: 0.9rem 1.15rem;
  }

  .purpose-card h2,
  .lab-note h2,
  .lab-note > strong {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--vlp-accent-red) !important;
    margin: 0 0 0.65rem 0;
    display: block;
  }

  .purpose-card p,
  .lab-note p,
  .lab-note ul,
  .lab-note li {
    background: transparent !important;
    background-color: transparent !important;
    color: inherit !important;
  }

  .lab-note ul {
    margin: 0 !important;
    padding-left: 20px !important;
  }

  .lab-note li {
    margin-bottom: 6px !important;
  }

  .lab-note li:last-child,
  .purpose-card p:last-child {
    margin-bottom: 0 !important;
  }

  .lab-note-entry {
    padding-top: 8px;
    margin-top: 8px;
    border-top: 1px solid var(--vlp-card-border);
  }

  .lab-note-entry:first-of-type {
    padding-top: 0;
    margin-top: 0;
    border-top: none;
  }

  /* Responsive Step Table & Nested Data Tables with Dark Mode Transparency Overrides */
  .lab-table,
  .vlp-data-table {
    width: 100%;
    max-width: 100%;
    table-layout: fixed;
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid var(--vlp-border) !important;
    border-radius: 8px;
    overflow: hidden;
    margin-top: 14px;
    background: transparent !important;
    background-color: transparent !important;
  }

  .lab-table td,
  .vlp-data-table th,
  .vlp-data-table td {
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .lab-table th.col-step-num {
    width: 68px !important;
    padding: 10px 8px;
    text-align: center;
    white-space: nowrap;
    overflow-wrap: normal;
    word-break: normal;
  }

  .lab-table > tbody > tr > td:first-child {
    padding-left: 8px;
    padding-right: 8px;
    text-align: center;
    white-space: nowrap;
  }

  .vlp-table-title {
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--vlp-accent-red) !important;
    margin: 12px 0 4px 0;
  }

  .vlp-data-table {
    margin: 8px 0 10px 0;
    border-radius: 6px;
  }

  .lab-table thead,
  .lab-table tbody,
  .lab-table tr,
  .lab-table td,
  .vlp-data-table thead,
  .vlp-data-table tbody,
  .vlp-data-table tr,
  .vlp-data-table td {
    background: transparent !important;
    background-color: transparent !important;
    color: inherit !important;
  }

  .lab-table tbody tr:nth-child(even),
  .lab-table tbody tr:nth-child(even) td,
  .vlp-data-table tbody tr:nth-child(even),
  .vlp-data-table tbody tr:nth-child(even) td {
    background-color: var(--vlp-row-even) !important;
  }

  .lab-table th,
  .vlp-data-table th {
    background-color: var(--vlp-th-bg) !important;
    color: inherit !important;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    padding: 10px 14px;
    text-align: left;
    border-bottom: 1px solid var(--vlp-border) !important;
  }

  .vlp-data-table th {
    padding: 8px 12px;
  }

  .lab-table td {
    padding: 12px 14px;
    border-top: 1px solid var(--vlp-border) !important;
    vertical-align: top;
  }

  .vlp-data-table td {
    padding: 8px 12px;
    border-top: 1px solid var(--vlp-border) !important;
    vertical-align: top;
  }

  .lab-table tbody tr:first-child td,
  .vlp-data-table tbody tr:first-child td {
    border-top: none !important;
  }

  .step-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    background-color: var(--vlp-accent-red) !important;
    color: #ffffff !important;
    border-radius: 50%;
    font-size: 0.85rem;
    font-weight: bold;
  }

  .ui-target {
    font-weight: 700;
    color: var(--vlp-accent-red) !important;
  }

  .course-overview code,
  .lab-wrapper code,
  code.cmd-inline {
    display: inline-block !important;
    max-width: 100%;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    word-break: break-word;
    background-color: var(--vlp-cmd-bg) !important;
    color: var(--vlp-cmd-text) !important;
    border: 1px solid var(--vlp-cmd-border) !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    font-size: 0.88em !important;
    padding: 2px 7px !important;
    border-radius: 4px !important;
    font-weight: 600 !important;
  }

  .key-press {
    display: inline-block;
    padding: 1px 6px;
    font-size: 0.8em;
    font-weight: 700;
    color: inherit !important;
    background-color: var(--vlp-kbd-bg) !important;
    border: 1px solid var(--vlp-kbd-border) !important;
    border-radius: 4px;
    box-shadow: 0 1px 0 var(--vlp-kbd-border);
  }

  .vlp-highlight,
  mark.vlp-highlight {
    background-color: var(--vlp-context-bg) !important;
    color: var(--vlp-context-text) !important;
    padding: 1px 5px;
    border-radius: 3px;
    font-weight: 600;
  }

  .term-box {
    max-width: 100%;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
    background-color: var(--vlp-cmd-bg) !important;
    color: #e2e8f0 !important;
    border: 1px solid var(--vlp-cmd-border) !important;
    border-radius: 6px;
    font-family: ui-monospace, Menlo, Monaco, Consolas, monospace !important;
    font-size: 0.85rem;
    padding: 10px 14px;
    margin-top: 8px;
    line-height: 1.5;
  }

  .term-prompt {
    color: var(--vlp-prompt) !important;
    font-weight: 600;
  }

  .step-context {
    background-color: var(--vlp-context-bg) !important;
    border-left: 4px solid var(--vlp-accent-red) !important;
    padding: 10px 14px;
    margin: 10px 0 6px 14px;
    font-size: 0.92rem;
    border-radius: 0 6px 6px 0;
    color: var(--vlp-context-text) !important;
    font-weight: 500;
  }

  .lab-table td img,
  .step-inline-img,
  .banner-img {
    display: block;
    width: auto;
    max-width: 100% !important;
    height: auto !important;
    object-fit: contain;
  }

  .lab-table td img,
  .step-inline-img {
    margin-top: 12px;
    border-radius: 6px;
    border: 1px solid var(--vlp-border);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }

  @container vlp-manual (max-width: 540px) {
    .course-overview,
    .lab-wrapper {
      font-size: 14px;
    }

    .lab-table th,
    .lab-table td,
    .vlp-data-table th,
    .vlp-data-table td {
      padding: 8px 9px;
    }

    .col-step-num {
      width: 52px !important;
      padding-left: 4px !important;
      padding-right: 4px !important;
      white-space: nowrap;
      overflow-wrap: normal;
      word-break: normal;
    }

    .lab-table > tbody > tr > td:first-child {
      padding-left: 4px;
      padding-right: 4px;
    }

    .step-context {
      margin-left: 6px;
    }
  }

  @media (max-width: 560px) {
    .course-overview,
    .lab-wrapper {
      font-size: 14px;
    }

    .lab-table th,
    .lab-table td,
    .vlp-data-table th,
    .vlp-data-table td {
      padding: 8px 9px;
    }

    .col-step-num {
      width: 52px !important;
      padding-left: 4px !important;
      padding-right: 4px !important;
      white-space: nowrap;
      overflow-wrap: normal;
      word-break: normal;
    }

    .lab-table > tbody > tr > td:first-child {
      padding-left: 4px;
      padding-right: 4px;
    }

    .step-context {
      margin-left: 6px;
    }
  }
</style>`;
  }

  const MASTER_STYLE_BLOCK = getMasterStyleBlock('crimson-slate');

  function generateUuid() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeHtmlPreserveEntities(str) {
    return String(str == null ? '' : str)
      .replace(/&(?!(?:[a-zA-Z]{2,10}|#\d{1,6}|#x[0-9a-fA-F]{1,6});)/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeXmlText(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeXmlAttr(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/'/g, '&apos;')
      .replace(/"/g, '&quot;');
  }

  function decodeXmlEntities(str) {
    return String(str == null ? '' : str).replace(
      /&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g,
      function (match, entity) {
        if (entity[0] === '#') {
          const isHex = entity[1] === 'x' || entity[1] === 'X';
          const code = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
          return Number.isNaN(code) ? match : String.fromCodePoint(code);
        }
        switch (entity) {
          case 'lt': return '<';
          case 'gt': return '>';
          case 'amp': return '&';
          case 'quot': return '"';
          case 'apos': return "'";
          case 'nbsp': return '\u00a0';
          case 'ndash': return '\u2013';
          case 'mdash': return '\u2014';
          case 'rsquo': return '\u2019';
          case 'lsquo': return '\u2018';
          case 'ldquo': return '\u201c';
          case 'rdquo': return '\u201d';
          default: return match;
        }
      }
    );
  }

  function stripZeroWidthAndNbsp(str) {
    return String(str == null ? '' : str)
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\u00a0/g, ' ');
  }

  /**
   * Formats raw text with ONLY explicit toolbar HTML tags or explicit markup shortcuts:
   * - [ui]...[/ui] or **...** -> <span class="ui-target">...</span>
   * - `...`                    -> <code class="cmd-inline">...</code>
   * - [[...]]                  -> <kbd class="key-press">...</kbd>
   * Also preserves rich text formatting tags inserted by the toolbar:
   * <strong>, <em>, <u>, <s>, <mark class="vlp-highlight">, <ul>, <ol>, <li>, <br />.
   * Never auto-guesses keywords or commands heuristically.
   */
  function formatInlineMarkup(raw) {
    if (raw == null) return '';
    let text = stripZeroWidthAndNbsp(String(raw)).trim();
    if (!text) return '';

    const tokens = [];
    function stash(htmlTag) {
      const key = `\uE000VLPTOK_${tokens.length}\uE001`;
      tokens.push(htmlTag);
      return key;
    }

    // 1. Stash <code...>...</code...> and <kbd...>...</kbd...> blocks intact so ** inside code is never parsed
    text = text.replace(
      /<code(?:\s+class=["']cmd-inline["'])?[^>]*>([\s\S]*?)<\/code>/gi,
      function (_, inner) {
        return stash('<code class="cmd-inline">' + escapeHtmlPreserveEntities(stripZeroWidthAndNbsp(inner)) + '</code>');
      }
    );

    text = text.replace(
      /<kbd(?:\s+class=["']key-press["'])?[^>]*>([\s\S]*?)<\/kbd>/gi,
      function (_, inner) {
        return stash('<kbd class="key-press">' + escapeHtmlPreserveEntities(stripZeroWidthAndNbsp(inner)) + '</kbd>');
      }
    );

    // 2. Stash allowed structural/inline open & close tags individually so nested combinations (e.g. <strong><u>...</u></strong>) work
    text = text.replace(/<br\s*\/?>/gi, function () { return stash('<br />'); });
    text = text.replace(/<span\s+class=["']ui-target["'][^>]*>/gi, function () { return stash('<span class="ui-target">'); });
    text = text.replace(/<\/span>/gi, function () { return stash('</span>'); });
    text = text.replace(/<mark(?:\s+class=["']vlp-highlight["'])?[^>]*>/gi, function () { return stash('<mark class="vlp-highlight">'); });
    text = text.replace(/<\/mark>/gi, function () { return stash('</mark>'); });
    text = text.replace(/<(strong|b)\b[^>]*>/gi, function () { return stash('<strong>'); });
    text = text.replace(/<\/(strong|b)>/gi, function () { return stash('</strong>'); });
    text = text.replace(/<(em|i)\b[^>]*>/gi, function () { return stash('<em>'); });
    text = text.replace(/<\/(em|i)>/gi, function () { return stash('</em>'); });
    text = text.replace(/<u\b[^>]*>/gi, function () { return stash('<u>'); });
    text = text.replace(/<\/u>/gi, function () { return stash('</u>'); });
    text = text.replace(/<(s|strike|del)\b[^>]*>/gi, function () { return stash('<s>'); });
    text = text.replace(/<\/(s|strike|del)>/gi, function () { return stash('</s>'); });
    text = text.replace(/<(ul|ol|li)\b[^>]*>/gi, function (_, tag) { return stash('<' + tag.toLowerCase() + '>'); });
    text = text.replace(/<\/(ul|ol|li)>/gi, function (_, tag) { return stash('</' + tag.toLowerCase() + '>'); });

    // 3. Escape remaining raw text (<, >, &)
    text = escapeHtmlPreserveEntities(text);

    // 4. Apply explicit markup shortcuts ONLY
    text = text.replace(/\[ui\]([\s\S]*?)\[\/ui\]/g, function (_, inner) {
      return '<span class="ui-target">' + inner + '</span>';
    });
    text = text.replace(/\*\*([^*\r\n]+?)\*\*/g, function (_, inner) {
      return '<span class="ui-target">' + inner + '</span>';
    });
    text = text.replace(/`([^`\r\n]+?)`/g, function (_, inner) {
      return '<code class="cmd-inline">' + inner + '</code>';
    });
    text = text.replace(/\[\[([^\]\r\n]+?)\]\]/g, function (_, inner) {
      return '<kbd class="key-press">' + inner + '</kbd>';
    });

    // 5. Restore stashed tags
    let pass = 0;
    while (text.indexOf('\uE000VLPTOK_') !== -1 && pass < 5) {
      text = text.replace(/\uE000VLPTOK_(\d+)\uE001/g, function (_, idx) {
        return tokens[Number(idx)] || '';
      });
      pass++;
    }

    // 6. Convert remaining line breaks outside list block boundaries into <br />
    text = text.replace(/\r?\n/g, '\n');
    const lines = text.split('\n');
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      const cur = lines[i];
      const next = i < lines.length - 1 ? lines[i + 1] : null;
      const isListTagLine = /^\s*<\/?(?:ul|ol|li)>/i.test(cur.trim()) || /<\/(?:ul|ol|li)>\s*$/i.test(cur.trim());
      const nextIsListTagLine = next !== null && /^\s*<\/?(?:ul|ol|li)>/i.test(next.trim());
      if (next !== null && !isListTagLine && !nextIsListTagLine) {
        out.push(cur + '<br />');
      } else {
        out.push(cur);
      }
    }
    return out.join('\n');
  }

  function extractFilenameFromSrc(src) {
    if (!src) return '';
    const cleaned = String(src).trim().split('?')[0].split('#')[0];
    const parts = cleaned.split('/');
    return parts[parts.length - 1] || '';
  }

  function resolveImageSrc(src, options) {
    const raw = String(src || '').trim();
    if (!raw) return '';
    const opts = options || {};
    const imageMap = opts.imageMap || {};
    const mode = opts.imageMode || 'vlp'; // 'vlp' | 'base64' | 'preview'
    const filename = extractFilenameFromSrc(raw);
    const lookup = imageMap[raw] || imageMap['./images/' + filename] || imageMap[filename];

    if (mode === 'base64') {
      if (lookup && lookup.dataUrl) return lookup.dataUrl;
      return raw;
    }
    if (mode === 'preview') {
      if (lookup && lookup.dataUrl) return lookup.dataUrl;
      if (lookup && lookup.previewUrl) return lookup.previewUrl;
      if (opts.samplePrefix && raw.startsWith('./images/')) {
        return opts.samplePrefix + '/' + raw.slice('./images/'.length);
      }
      return raw;
    }
    if (raw.startsWith('data:') && lookup && lookup.filename) {
      return './images/' + lookup.filename;
    }
    return raw;
  }

  function splitParagraphs(text) {
    if (!text) return [];
    return String(text)
      .split(/\r?\n\s*\r?\n/)
      .map(function (p) { return p.trim(); })
      .filter(Boolean);
  }

  function renderRichParagraphsHtml(text, indentSpaces) {
    const pad = ' '.repeat(indentSpaces || 2);
    const blocks = splitParagraphs(text);
    return blocks.map(function (blk) {
      const formatted = formatInlineMarkup(blk);
      if (/^<(?:ul|ol)\b/i.test(formatted) && /<\/(?:ul|ol)>$/i.test(formatted)) {
        return formatted.split('\n').map(function (l) { return pad + l; }).join('\n');
      }
      return pad + '<p>' + formatted + '</p>';
    }).join('\n');
  }

  /* =========================================================================
   * Default Factories & Data Migration Helpers
   * ========================================================================= */
  function createDefaultCredentialEntry(overrides) {
    return Object.assign({
      id: generateUuid(),
      title: '',
      targetSystem: '',
      username: '',
      password: '',
      note: ''
    }, overrides || {});
  }

  function normalizeCredentialsList(obj) {
    if (!obj) return [];
    if (Array.isArray(obj.credentialsList) && obj.credentialsList.length > 0) {
      return obj.credentialsList.map(function (c) { return createDefaultCredentialEntry(c); });
    }
    if (obj.credentialsTarget || obj.credentialsUsername || obj.credentialsPassword) {
      return [createDefaultCredentialEntry({
        title: obj.credentialsTitle || '',
        targetSystem: obj.credentialsTarget || '',
        username: obj.credentialsUsername || '',
        password: obj.credentialsPassword || ''
      })];
    }
    return [];
  }

  function createDefaultTable(overrides) {
    return Object.assign({
      id: generateUuid(),
      title: '',
      hasHeader: true,
      rows: [
        ['Field', 'Value'],
        ['', '']
      ]
    }, overrides || {});
  }

  function createDefaultOverviewData() {
    return {
      courseTitle: '',
      bannerSrc: '',
      bannerAlt: 'Course Banner',
      overviewText: '',
      tables: [],
      showDivider: true,
      purposeEnabled: false,
      purposeTitle: 'INSTRUCTIONAL PURPOSE',
      purposeText: '',
      credentialsEnabled: false,
      credentialsTitle: 'Target VM Credentials',
      credentialsList: []
    };
  }

  function createDefaultStep() {
    return {
      id: generateUuid(),
      instruction: '',
      contextText: '',
      termPrompt: '',
      termCommand: '',
      termOutput: '',
      credentialsList: [],
      tables: [],
      images: []
    };
  }

  function migrateStepData(step) {
    if (!step) return createDefaultStep();
    const s = Object.assign(createDefaultStep(), step);
    if (!s.contextText && (step.whatDoing || step.whyMatters)) {
      const parts = [];
      if (step.whatDoing && step.whatDoing.trim()) parts.push(step.whatDoing.trim());
      if (step.whyMatters && step.whyMatters.trim()) parts.push(step.whyMatters.trim());
      s.contextText = parts.join('\n');
    }
    if (!Array.isArray(s.credentialsList)) s.credentialsList = [];
    if (!Array.isArray(s.tables)) s.tables = [];
    if (!Array.isArray(s.images)) s.images = [];
    return s;
  }

  function createDefaultStepsData() {
    return {
      sectionTitle: '',
      introText: '',
      credentialsEnabled: false,
      credentialsTitle: 'Target VM Credentials',
      credentialsList: [],
      tables: [],
      steps: [createDefaultStep()]
    };
  }

  /* =========================================================================
   * Shared Renderers: Credentials (.lab-note) & Data Tables (.vlp-data-table)
   * ========================================================================= */
  function renderCredentialsCardHtml(title, list, indentSpaces) {
    const entries = (list || []).filter(function (c) {
      return c && (
        (c.targetSystem && c.targetSystem.trim()) ||
        (c.username && c.username.trim()) ||
        (c.password && c.password.trim()) ||
        (c.note && c.note.trim())
      );
    });
    if (entries.length === 0) return '';

    const pad = ' '.repeat(indentSpaces || 2);
    const heading = (title && title.trim()) ? title.trim() : 'Target VM Credentials';
    const lines = [];
    lines.push(pad + '<div class="lab-note">');
    lines.push(pad + '  <h2>' + escapeHtmlPreserveEntities(heading) + '</h2>');

    entries.forEach(function (entry) {
      const wrapInEntry = entries.length > 1;
      const innerPad = pad + (wrapInEntry ? '    ' : '  ');
      if (wrapInEntry) {
        lines.push(pad + '  <div class="lab-note-entry">');
      }
      lines.push(innerPad + '<ul>');
      if (entry.targetSystem && entry.targetSystem.trim()) {
        lines.push(innerPad + '  <li><strong>Target System:</strong> <span class="ui-target">' + escapeHtmlPreserveEntities(entry.targetSystem.trim()) + '</span></li>');
      }
      if (entry.username && entry.username.trim()) {
        lines.push(innerPad + '  <li><strong>Username:</strong> <code class="cmd-inline">' + escapeHtmlPreserveEntities(entry.username.trim()) + '</code></li>');
      }
      if (entry.password && entry.password.trim()) {
        lines.push(innerPad + '  <li><strong>Password:</strong> <code class="cmd-inline">' + escapeHtmlPreserveEntities(entry.password.trim()) + '</code></li>');
      }
      if (entry.note && entry.note.trim()) {
        lines.push(innerPad + '  <li><strong>Details:</strong> ' + formatInlineMarkup(entry.note.trim()) + '</li>');
      }
      lines.push(innerPad + '</ul>');
      if (wrapInEntry) {
        lines.push(pad + '  </div>');
      }
    });

    lines.push(pad + '</div>');
    return lines.join('\n');
  }

  function renderDataTablesHtml(tables, indentSpaces) {
    const valid = (tables || []).filter(function (tbl) {
      return tbl && Array.isArray(tbl.rows) && tbl.rows.length > 0;
    });
    if (valid.length === 0) return '';
    const pad = ' '.repeat(indentSpaces || 2);
    const chunks = [];

    valid.forEach(function (tbl) {
      const lines = [];
      if (tbl.title && tbl.title.trim()) {
        lines.push(pad + '<div class="vlp-table-title">' + formatInlineMarkup(tbl.title.trim()) + '</div>');
      }
      lines.push(pad + '<table class="vlp-data-table">');
      const rows = tbl.rows;
      const hasHeader = tbl.hasHeader !== false && rows.length > 1;
      if (hasHeader) {
        lines.push(pad + '  <thead>');
        lines.push(pad + '    <tr>');
        rows[0].forEach(function (cell) {
          lines.push(pad + '      <th>' + formatInlineMarkup(cell) + '</th>');
        });
        lines.push(pad + '    </tr>');
        lines.push(pad + '  </thead>');
      }
      const bodyRows = hasHeader ? rows.slice(1) : rows;
      lines.push(pad + '  <tbody>');
      bodyRows.forEach(function (r) {
        lines.push(pad + '    <tr>');
        r.forEach(function (cell) {
          lines.push(pad + '      <td>' + formatInlineMarkup(cell) + '</td>');
        });
        lines.push(pad + '    </tr>');
      });
      lines.push(pad + '  </tbody>');
      lines.push(pad + '</table>');
      chunks.push(lines.join('\n'));
    });

    return chunks.join('\n');
  }

  /* =========================================================================
   * Primary VLP HTML Generators
   * ========================================================================= */
  function generateCourseOverviewHtml(data, options) {
    const opts = options || {};
    const d = Object.assign(createDefaultOverviewData(), data || {});
    d.credentialsList = normalizeCredentialsList(d);
    const lines = [];
    lines.push(getMasterStyleBlock(opts.colorTheme));
    lines.push('<div class="course-overview">');

    if (d.courseTitle && d.courseTitle.trim()) {
      lines.push('  <div class="course-header">');
      lines.push('    <h1>' + escapeHtmlPreserveEntities(stripZeroWidthAndNbsp(d.courseTitle.trim())) + '</h1>');
      lines.push('  </div>');
    }

    if (d.bannerSrc && d.bannerSrc.trim()) {
      const resolvedBanner = resolveImageSrc(d.bannerSrc.trim(), opts);
      const altText = escapeHtml(d.bannerAlt && d.bannerAlt.trim() ? d.bannerAlt.trim() : 'Course Banner');
      lines.push('');
      lines.push('  <div class="banner-container">');
      lines.push('    <img class="banner-img" src="' + escapeHtml(resolvedBanner) + '" alt="' + altText + '" />');
      lines.push('  </div>');
    }

    const overviewBlocksHtml = renderRichParagraphsHtml(d.overviewText, 2);
    if (overviewBlocksHtml) {
      lines.push('');
      lines.push(overviewBlocksHtml);
    }

    const tablesHtml = renderDataTablesHtml(d.tables, 2);
    if (tablesHtml) {
      lines.push('');
      lines.push(tablesHtml);
    }

    const credHtml = d.credentialsEnabled ? renderCredentialsCardHtml(d.credentialsTitle, d.credentialsList, 2) : '';
    const hasRedCard = Boolean(d.purposeEnabled || credHtml);
    if (d.showDivider && (overviewBlocksHtml || tablesHtml || d.bannerSrc || d.courseTitle) && hasRedCard) {
      lines.push('');
      lines.push('  <hr class="section-divider" />');
    }

    if (d.purposeEnabled) {
      const pTitle = (d.purposeTitle && d.purposeTitle.trim()) ? d.purposeTitle.trim() : 'INSTRUCTIONAL PURPOSE';
      const pHtml = renderRichParagraphsHtml(d.purposeText, 4);
      lines.push('');
      lines.push('  <div class="purpose-card">');
      lines.push('    <h2>' + escapeHtmlPreserveEntities(pTitle) + '</h2>');
      if (!pHtml) {
        lines.push('    <p>Purpose details for the course annex.</p>');
      } else {
        lines.push(pHtml);
      }
      lines.push('  </div>');
    }

    if (credHtml) {
      lines.push('');
      lines.push(credHtml);
    } else if (d.credentialsEnabled) {
      lines.push('');
      lines.push(renderCredentialsCardHtml(d.credentialsTitle, [createDefaultCredentialEntry({ targetSystem: 'VM-NAME' })], 2));
    }

    lines.push('</div>');
    return lines.join('\n');
  }

  function generateProceduralStepsHtml(data, options) {
    const opts = options || {};
    const d = Object.assign(createDefaultStepsData(), data || {});
    d.credentialsList = normalizeCredentialsList(d);
    const steps = (Array.isArray(d.steps) ? d.steps : []).map(migrateStepData);
    const lines = [];
    lines.push(getMasterStyleBlock(opts.colorTheme));
    lines.push('<div class="lab-wrapper">');

    if (d.sectionTitle && d.sectionTitle.trim()) {
      lines.push('  <div class="lab-header">');
      lines.push('    <h3>' + escapeHtmlPreserveEntities(stripZeroWidthAndNbsp(d.sectionTitle.trim())) + '</h3>');
      lines.push('  </div>');
    }

    const introHtml = renderRichParagraphsHtml(d.introText, 2);
    if (introHtml) {
      lines.push('');
      lines.push(introHtml);
    }

    const introTablesHtml = renderDataTablesHtml(d.tables, 2);
    if (introTablesHtml) {
      lines.push('');
      lines.push(introTablesHtml);
    }

    if (d.credentialsEnabled || d.credentialsList.length > 0) {
      const pageCredHtml = renderCredentialsCardHtml(d.credentialsTitle, d.credentialsList, 2);
      if (pageCredHtml) {
        lines.push('');
        lines.push(pageCredHtml);
      }
    }

    lines.push('');
    lines.push('  <table class="lab-table">');
    lines.push('    <thead>');
    lines.push('      <tr>');
    lines.push('        <th class="col-step-num" style="width: 68px; text-align: center;">Step</th>');
    lines.push('        <th style="width: auto;">Action &amp; Verification</th>');
    lines.push('      </tr>');
    lines.push('    </thead>');
    lines.push('    <tbody>');

    steps.forEach(function (step, index) {
      const stepNum = index + 1;
      lines.push('      <tr>');
      lines.push('        <td style="text-align: center;"><span class="step-badge">' + stepNum + '</span></td>');
      lines.push('        <td>');
      if (step.instruction && step.instruction.trim()) {
        lines.push('          ' + formatInlineMarkup(step.instruction));
      }

      if (step.contextText && step.contextText.trim()) {
        lines.push('          <div class="step-context">');
        lines.push('            ' + formatInlineMarkup(step.contextText));
        lines.push('          </div>');
      }

      const stepCredHtml = renderCredentialsCardHtml('Target VM Credentials', step.credentialsList, 10);
      if (stepCredHtml) {
        lines.push(stepCredHtml);
      }

      const stepTablesHtml = renderDataTablesHtml(step.tables, 10);
      if (stepTablesHtml) {
        lines.push(stepTablesHtml);
      }

      const hasPrompt = Boolean(step.termPrompt && step.termPrompt.trim());
      const hasCmd = Boolean(step.termCommand && step.termCommand.trim());
      const hasOut = Boolean(step.termOutput && step.termOutput.trim());
      if (hasPrompt || hasCmd || hasOut) {
        lines.push('          <div class="term-box">');
        const outLines = hasOut
          ? step.termOutput.split(/\r?\n/).map(function (l) { return escapeHtmlPreserveEntities(l); })
          : [];
        if (hasPrompt || hasCmd) {
          let firstLine = '';
          if (hasPrompt) {
            firstLine += '<span class="term-prompt">' + escapeHtmlPreserveEntities(step.termPrompt.trim()) + '</span>';
          }
          if (hasCmd) {
            firstLine += (firstLine ? ' ' : '') + escapeHtmlPreserveEntities(step.termCommand.trim());
          }
          if (outLines.length > 0) {
            firstLine += '<br />';
          }
          lines.push('            ' + firstLine);
        }
        outLines.forEach(function (ol, oi) {
          const suffix = oi < outLines.length - 1 ? '<br />' : '';
          lines.push('            ' + ol + suffix);
        });
        lines.push('          </div>');
      }

      const imgs = Array.isArray(step.images) ? step.images : [];
      imgs.forEach(function (img, imgIdx) {
        if (!img || !img.src || !img.src.trim()) return;
        const resolved = resolveImageSrc(img.src.trim(), opts);
        const alt = escapeHtml((img.alt && img.alt.trim()) ? img.alt.trim() : ('Step ' + stepNum + (imgs.length > 1 ? ' Image ' + (imgIdx + 1) : ' Screenshot')));
        lines.push('          <img class="step-inline-img" src="' + escapeHtml(resolved) + '" alt="' + alt + '" />');
      });

      lines.push('        </td>');
      lines.push('      </tr>');
    });

    lines.push('    </tbody>');
    lines.push('  </table>');
    lines.push('</div>');
    return lines.join('\n');
  }

  function generateNodeHtml(node, options) {
    if (!node) return '';
    if (node.mode === 'overview') {
      return generateCourseOverviewHtml(node.overview, options);
    }
    if (node.mode === 'steps') {
      return generateProceduralStepsHtml(node.stepsData, options);
    }
    let html = String(node.rawHtml || '');
    if (options && (options.imageMode === 'preview' || options.imageMode === 'base64')) {
      html = html.replace(/(<img\b[^>]*\bsrc=)(["'])([^"']+)\2/gi, function (_, prefix, quote, src) {
        return prefix + quote + escapeHtml(resolveImageSrc(src, options)) + quote;
      });
    }
    return html;
  }

  /* =========================================================================
   * Deterministic Raw Text & Legacy HTML Parsers
   * ========================================================================= */
  function parseRawTextToSteps(rawText, options) {
    const opts = options || {};
    const splitMode = ['smart', 'numbered', 'paragraph', 'line'].indexOf(opts.splitMode) !== -1
      ? opts.splitMode
      : 'smart';
    const unwrapPdfLines = opts.unwrapPdfLines !== undefined
      ? Boolean(opts.unwrapPdfLines)
      : (splitMode !== 'line');

    const warnings = [];
    const errors = [];

    if (rawText !== null && rawText !== undefined && typeof rawText !== 'string') {
      errors.push('Converter input must be plain text.');
      return { sectionTitle: '', introText: '', steps: [], warnings: warnings, errors: errors, detectedMode: 'invalid' };
    }

    const cleaned = stripZeroWidthAndNbsp(rawText || '').trim();
    if (!cleaned) {
      errors.push('Paste or type one or more procedural steps or paragraphs before converting.');
      return { sectionTitle: '', introText: '', steps: [], warnings: warnings, errors: errors, detectedMode: 'empty' };
    }

    if (cleaned.length > 200000) {
      errors.push('Input exceeds 200,000 characters. Split long lab guides into smaller chapters before converting.');
      return { sectionTitle: '', introText: '', steps: [], warnings: warnings, errors: errors, detectedMode: 'too-large' };
    }

    if (/^%PDF-/i.test(cleaned)) {
      errors.push('Detected raw PDF binary data (%PDF-). Copy readable text from your PDF viewer rather than dropping binary bytes here.');
      return { sectionTitle: '', introText: '', steps: [], warnings: warnings, errors: errors, detectedMode: 'binary-pdf' };
    }

    if (/^\{\\rtf\d*/i.test(cleaned)) {
      errors.push('Detected raw RTF formatting codes ({\\rtf). Open the RTF document in Word/WordPad and copy the visible text.');
      return { sectionTitle: '', introText: '', steps: [], warnings: warnings, errors: errors, detectedMode: 'raw-rtf' };
    }

    if (/^(?:<\?xml\b|<Manual\b|<ContentNodes\b)/i.test(cleaned)) {
      errors.push('Detected VLP XML markup. Use "Import XML / ZIP" in the top bar to load XML manuals.');
      return { sectionTitle: '', introText: '', steps: [], warnings: warnings, errors: errors, detectedMode: 'vlp-xml' };
    }

    const rawLines = cleaned.split(/\r?\n/);
    let sectionTitle = '';
    const introParts = [];
    const contentLines = [];

    let idx = 0;
    while (idx < rawLines.length) {
      const line = rawLines[idx].trim();
      if (!line && contentLines.length === 0) {
        idx++;
        continue;
      }
      if (contentLines.length === 0 && !sectionTitle && /^(?:#{1,3}\s+|Section:\s*|Title:\s*)/i.test(line)) {
        sectionTitle = line.replace(/^(?:#{1,3}\s+|Section:\s*|Title:\s*)/i, '').trim();
        idx++;
        continue;
      }
      if (contentLines.length === 0 && /^Intro:\s*/i.test(line)) {
        introParts.push(line.replace(/^Intro:\s*/i, '').trim());
        idx++;
        continue;
      }
      contentLines.push(rawLines[idx]);
      idx++;
    }

    // Matches "Step 1: ...", "Step 2 ...", or "1. ..." / "2) ..." (avoids decimals/IPv4 like 6.7 or 192.168.10.11)
    function matchStepHeader(rawLine) {
      const mStep = rawLine.match(/^\s*step\s+(\d{1,3})\s*(?:[:.\-)]\s*(.*)|\s+(.*))?$/i);
      if (mStep) {
        return { matched: true, num: Number(mStep[1]), rest: (mStep[2] || mStep[3] || '').trim() };
      }
      const mNum = rawLine.match(/^\s*(\d{1,3})\s*[.)](?:\s+(.*)|$)/);
      if (mNum && Number(mNum[1]) <= 200) {
        const rest = (mNum[2] || '').trim();
        if (/^\s*\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(rawLine)) {
          return { matched: false, num: 0, rest: '' };
        }
        return { matched: true, num: Number(mNum[1]), rest: rest };
      }
      return { matched: false, num: 0, rest: '' };
    }

    function countStepHeaders(lines) {
      let count = 0;
      let inFence = false;
      lines.forEach(function (l) {
        const t = l.trim();
        if (/^```/.test(t)) {
          inFence = !inFence;
          return;
        }
        if (!inFence && matchStepHeader(l).matched) count++;
      });
      return count;
    }

    function splitIntoParagraphBlocks(lines) {
      const out = [];
      let cur = [];
      let inFence = false;
      lines.forEach(function (l) {
        const t = l.trim();
        if (/^```/.test(t)) inFence = !inFence;
        if (!inFence && !t) {
          if (cur.length) {
            out.push(cur);
            cur = [];
          }
        } else {
          cur.push(l);
        }
      });
      if (cur.length) out.push(cur);
      return out;
    }

    const numberedCount = countStepHeaders(contentLines);
    const blocks = [];
    let detectedMode = 'paragraphs';

    if (splitMode === 'numbered' || (splitMode === 'smart' && numberedCount >= 1)) {
      if (numberedCount >= 1) {
        detectedMode = 'numbered';
        let current = null;
        let inFence = false;
        contentLines.forEach(function (rawLine) {
          const trimmed = rawLine.trim();
          if (/^```/.test(trimmed)) inFence = !inFence;
          const hdr = !inFence ? matchStepHeader(rawLine) : { matched: false, rest: '' };
          if (hdr.matched) {
            if (current) blocks.push(current);
            current = hdr.rest ? [hdr.rest] : [];
          } else if (current !== null) {
            current.push(rawLine);
          } else if (trimmed) {
            introParts.push(trimmed);
          }
        });
        if (current) blocks.push(current);
      } else {
        detectedMode = 'single';
        if (contentLines.some(function (l) { return l.trim(); })) {
          blocks.push(contentLines.slice());
        }
        warnings.push('No numbered prefixes (like "1." or "Step 1:") were found; kept the pasted text together as 1 step.');
      }
    } else if (splitMode === 'line') {
      detectedMode = 'lines';
      let inFence = false;
      let fenceBuf = [];
      contentLines.forEach(function (rawLine) {
        const t = rawLine.trim();
        if (/^```/.test(t)) {
          if (!inFence) {
            inFence = true;
            fenceBuf = [rawLine];
          } else {
            fenceBuf.push(rawLine);
            blocks.push(fenceBuf);
            fenceBuf = [];
            inFence = false;
          }
          return;
        }
        if (inFence) {
          fenceBuf.push(rawLine);
          return;
        }
        if (!t) return;
        const hdr = matchStepHeader(rawLine);
        const cleanedLine = hdr.matched
          ? hdr.rest
          : t.replace(/^(?:[-•*]|\u2022)\s+/, '').trim();
        if (cleanedLine) blocks.push([cleanedLine]);
      });
      if (fenceBuf.length) {
        blocks.push(fenceBuf);
        warnings.push('An unclosed ``` terminal code fence was automatically closed.');
      }
    } else if (splitMode === 'paragraph') {
      detectedMode = 'paragraphs';
      splitIntoParagraphBlocks(contentLines).forEach(function (paraLines) {
        const outLines = paraLines.slice();
        if (outLines.length) {
          const hdr = matchStepHeader(outLines[0]);
          if (hdr.matched) {
            if (hdr.rest) outLines[0] = hdr.rest;
            else outLines.shift();
          }
        }
        if (outLines.some(function (l) { return l.trim(); })) blocks.push(outLines);
      });
    } else {
      // splitMode === 'smart' with NO numbered steps: keep multi-line paragraphs together!
      const nonEmptyLines = contentLines.filter(function (l) { return l.trim(); });
      const bulletRe = /^\s*(?:[-•*]|\u2022)\s+(.*)$/;
      const allBullets = nonEmptyLines.length > 0 && nonEmptyLines.every(function (l) {
        return bulletRe.test(l) || /^\s{2,}\S/.test(l);
      }) && bulletRe.test(nonEmptyLines[0]);

      if (allBullets) {
        detectedMode = 'bullets';
        let curBullet = null;
        contentLines.forEach(function (rawLine) {
          const t = rawLine.trim();
          if (!t) return;
          const bm = rawLine.match(bulletRe);
          if (bm) {
            if (curBullet) blocks.push(curBullet);
            curBullet = [bm[1].trim()];
          } else if (curBullet) {
            curBullet.push(t);
          }
        });
        if (curBullet) blocks.push(curBullet);
      } else {
        detectedMode = 'paragraphs';
        splitIntoParagraphBlocks(contentLines).forEach(function (paraLines) {
          if (paraLines.some(function (l) { return l.trim(); })) blocks.push(paraLines);
        });
      }
    }

    function unwrapProseParagraphs(linesArr) {
      const paras = [];
      let curPara = [];
      function flushPara() {
        if (!curPara.length) return;
        if (!unwrapPdfLines) {
          paras.push(curPara.join('\n'));
        } else {
          let merged = '';
          for (let i = 0; i < curPara.length; i++) {
            const line = curPara[i];
            if (i === 0) {
              merged = line;
            } else {
              const prev = curPara[i - 1];
              const isSubBullet = /^(?:[-•*]|\u2022|[a-z0-9][.)])\s+/i.test(line);
              const prevEndedHard = /:\s*$/.test(prev);
              if (isSubBullet || prevEndedHard) {
                merged += '\n' + line;
              } else if (/-\s*$/.test(prev) && !/\s-\s*$/.test(prev) && /^[a-z]/.test(line)) {
                merged = merged.replace(/-\s*$/, '') + line;
              } else {
                merged += ' ' + line;
              }
            }
          }
          paras.push(merged);
        }
        curPara = [];
      }
      linesArr.forEach(function (l) {
        const t = l === '' ? '' : l.trim();
        if (!t) flushPara();
        else curPara.push(t);
      });
      flushPara();
      return paras.join('\n\n');
    }

    function detectShortcutIssues(textBlock) {
      const issues = [];
      const uiDouble = (textBlock.match(/\*\*/g) || []).length;
      if (uiDouble % 2 !== 0) issues.push('unclosed **UI Target** marker');
      const backticks = (textBlock.match(/`/g) || []).length;
      if (backticks % 2 !== 0) issues.push('unclosed `command` backtick');
      const kbdOpen = (textBlock.match(/\[\[/g) || []).length;
      const kbdClose = (textBlock.match(/\]\]/g) || []).length;
      if (kbdOpen !== kbdClose) issues.push('unbalanced [[Key Press]] brackets');
      const uiOpen = (textBlock.match(/\[ui\]/g) || []).length;
      const uiClose = (textBlock.match(/\[\/ui\]/g) || []).length;
      if (uiOpen !== uiClose) issues.push('unbalanced [ui]...[/ui] tags');
      return issues;
    }

    const cliPromptRe = /^((?:\[[^\]]+\]\s*[$#]|[^\s@]+@[^\s:]+:[^$#]*[$#]|[A-Z]:\\[^>]*>|PS\s+[^>]+>|(?:Switch|Router|Firewall|ASA)(?:\([^)]*\))?\s*[>#]))\s*(.*)$/;
    let unclosedFenceWarned = false;
    let emptyStepCount = 0;
    const steps = [];

    blocks.forEach(function (blockLines) {
      const step = createDefaultStep();
      const instLines = [];
      const ctxLines = [];
      let inTermFence = false;
      const termLines = [];
      let lastSection = ''; // 'inst' | 'ctx' | ''

      blockLines.forEach(function (line) {
        const t = line.trim();
        if (/^```(?:term|terminal|sh|bash|cli|powershell|ps1)?\s*$/i.test(t)) {
          inTermFence = !inTermFence;
          lastSection = 'term';
          return;
        }
        if (inTermFence) {
          termLines.push(line);
          return;
        }
        if (!t) {
          if (lastSection === 'inst' && instLines.length > 0 && instLines[instLines.length - 1] !== '') {
            instLines.push('');
          }
          return;
        }
        const ctxMatch = t.match(/^(?:Context|What you are doing|Why this matters|Lab note|Note|Check your work|Tip):\s*(.*)$/i);
        if (ctxMatch) {
          if (ctxMatch[1].trim()) ctxLines.push(ctxMatch[1].trim());
          lastSection = 'ctx';
          return;
        }
        const termMatch = t.match(/^(?:Terminal|Output|Command):\s*(.*)$/i);
        if (termMatch) {
          if (termMatch[1].trim()) termLines.push(termMatch[1].trim());
          lastSection = 'term';
          return;
        }
        lastSection = 'inst';
        instLines.push(t);
      });

      if (inTermFence && !unclosedFenceWarned) {
        unclosedFenceWarned = true;
        warnings.push('An unclosed ``` terminal code fence was automatically closed.');
      }

      step.instruction = unwrapProseParagraphs(instLines);
      step.contextText = ctxLines.join('\n');

      if (termLines.length > 0) {
        const first = termLines[0].trim();
        const promptMatch = first.match(cliPromptRe);
        if (promptMatch) {
          step.termPrompt = promptMatch[1].trim();
          step.termCommand = promptMatch[2].trim();
          step.termOutput = termLines.slice(1).join('\n');
        } else {
          step.termOutput = termLines.join('\n');
        }
      }

      const hasContent = Boolean(
        (step.instruction && step.instruction.trim()) ||
        (step.contextText && step.contextText.trim()) ||
        (step.termPrompt && step.termPrompt.trim()) ||
        (step.termCommand && step.termCommand.trim()) ||
        (step.termOutput && step.termOutput.trim())
      );
      if (!hasContent) {
        emptyStepCount++;
        return;
      }

      const combinedInline = [step.instruction, step.contextText].filter(Boolean).join('\n');
      const shortcutIssues = detectShortcutIssues(combinedInline);
      if (shortcutIssues.length > 0) {
        warnings.push('Step ' + (steps.length + 1) + ' has ' + shortcutIssues.join(', ') + ' — verify formatting in Live Preview.');
      }

      steps.push(step);
    });

    if (emptyStepCount > 0) {
      warnings.push('Skipped ' + emptyStepCount + ' empty step header(s) with no instruction text.');
    }

    if (steps.length === 0 && errors.length === 0) {
      errors.push('No valid procedural steps could be extracted. Verify your text is not just empty headers or metadata.');
    }

    return {
      sectionTitle: sectionTitle,
      introText: introParts.join('\n\n'),
      steps: steps,
      warnings: warnings,
      errors: errors,
      detectedMode: detectedMode
    };
  }

  function stripLegacyWrappers(html) {
    let s = stripZeroWidthAndNbsp(String(html || ''));
    s = s.replace(/<!--[\s\S]*?-->/g, '');
    let prev;
    do {
      prev = s;
      s = s.replace(/<span(?:\s+style=["'][^"']*["'])?\s*>([\s\S]*?)<\/span>/gi, '$1');
    } while (s !== prev);
    s = s.replace(/&nbsp;/gi, ' ');
    s = s.replace(/<p[^>]*>\s*(?:<strong[^>]*>\s*<\/strong>|<em>\s*<\/em>)?\s*<\/p>/gi, '');
    return s.trim();
  }

  function extractImagesFromHtml(html) {
    const imgs = [];
    const re = /<img\b([^>]*)>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      const attrs = parseXmlAttributes(m[1]);
      if (attrs.src) {
        imgs.push({
          src: decodeXmlEntities(attrs.src).trim(),
          alt: decodeXmlEntities(attrs.alt || '').trim(),
          width: attrs.width || '',
          height: attrs.height || ''
        });
      }
    }
    return imgs;
  }

  function stripTagsToCleanInline(html) {
    let s = stripLegacyWrappers(html);
    s = s.replace(/<img\b[^>]*>/gi, '');
    s = s.replace(/<br\s*\/?>/gi, '\n');
    s = s.replace(/<code>([\s\S]*?)<\/code>/gi, '<code class="cmd-inline">$1</code>');
    const tokens = [];
    s = s.replace(/<(\/?)(strong|em|u|s|ul|ol|li)\b[^>]*>/gi, function (_, slash, tag) {
      const k = `\uE002TAG_${tokens.length}\uE003`;
      tokens.push('<' + slash + tag.toLowerCase() + '>');
      return k;
    });
    s = s.replace(/<span\s+class=["']ui-target["'][^>]*>([\s\S]*?)<\/span>/gi, function (_, inner) {
      const k = `\uE002TAG_${tokens.length}\uE003`;
      tokens.push('<span class="ui-target">' + inner.trim() + '</span>');
      return k;
    });
    s = s.replace(/<code\s+class=["']cmd-inline["'][^>]*>([\s\S]*?)<\/code>/gi, function (_, inner) {
      const k = `\uE002TAG_${tokens.length}\uE003`;
      tokens.push('<code class="cmd-inline">' + inner.trim() + '</code>');
      return k;
    });
    s = s.replace(/<kbd\s+class=["']key-press["'][^>]*>([\s\S]*?)<\/kbd>/gi, function (_, inner) {
      const k = `\uE002TAG_${tokens.length}\uE003`;
      tokens.push('<kbd class="key-press">' + inner.trim() + '</kbd>');
      return k;
    });
    s = s.replace(/<mark(?:\s+class=["']vlp-highlight["'])?[^>]*>([\s\S]*?)<\/mark>/gi, function (_, inner) {
      const k = `\uE002TAG_${tokens.length}\uE003`;
      tokens.push('<mark class="vlp-highlight">' + inner.trim() + '</mark>');
      return k;
    });
    s = s.replace(/<[^>]+>/g, '');
    s = decodeXmlEntities(s);
    let pass = 0;
    while (s.indexOf('\uE002TAG_') !== -1 && pass < 5) {
      s = s.replace(/\uE002TAG_(\d+)\uE003/g, function (_, idx) {
        return tokens[Number(idx)] || '';
      });
      pass++;
    }
    s = s.replace(/<strong>\s*<strong>([\s\S]*?)<\/strong>\s*<\/strong>/gi, '<strong>$1</strong>');
    s = s.replace(/<strong>\s*<\/strong>/gi, '');
    s = s.replace(/<em>\s*<\/em>/gi, '');
    s = s.replace(/[ \t]{2,}/g, ' ');
    return s.split('\n').map(function (l) { return l.trim(); }).filter(Boolean).join('\n').trim();
  }

  function extractLegacyBlockElements(html) {
    const cleaned = stripLegacyWrappers(html);
    const blocks = [];
    const blockRe = /<(p|ul|ol|table|h[1-6]|div)\b[^>]*>([\s\S]*?)<\/\1>/gi;
    let lastIdx = 0;
    let m;
    while ((m = blockRe.exec(cleaned)) !== null) {
      const before = cleaned.slice(lastIdx, m.index).trim();
      if (before) {
        const inlineText = stripTagsToCleanInline(before);
        if (inlineText) blocks.push({ type: 'p', text: inlineText });
      }
      lastIdx = m.index + m[0].length;
      const tag = m[1].toLowerCase();
      const inner = m[2];
      if (tag === 'ul' || tag === 'ol') {
        const items = [];
        const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
        let lm;
        while ((lm = liRe.exec(inner)) !== null) {
          const txt = stripTagsToCleanInline(lm[1]);
          if (txt) items.push(txt);
        }
        if (items.length) blocks.push({ type: tag, items: items });
      } else if (tag === 'table') {
        const hasThead = /<thead\b/i.test(inner);
        const rows = [];
        const trRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
        let rm;
        while ((rm = trRe.exec(inner)) !== null) {
          const cells = [];
          const cellRe = /<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
          let cm;
          while ((cm = cellRe.exec(rm[1])) !== null) {
            cells.push(stripTagsToCleanInline(cm[1]).replace(/\n/g, ' '));
          }
          if (cells.some(Boolean)) rows.push(cells);
        }
        if (rows.length) {
          const maxCols = rows.reduce(function (mx, r) { return Math.max(mx, r.length); }, 1);
          const normRows = rows.map(function (r) {
            while (r.length < maxCols) r.push('');
            return r;
          });
          blocks.push({ type: 'table', hasHeader: hasThead, rows: normRows });
        }
      } else {
        const txt = stripTagsToCleanInline(inner);
        if (txt) blocks.push({ type: tag, text: txt });
      }
    }
    const tail = cleaned.slice(lastIdx).trim();
    if (tail) {
      const tailTxt = stripTagsToCleanInline(tail);
      if (tailTxt) blocks.push({ type: 'p', text: tailTxt });
    }
    return blocks;
  }

  function parseLabNoteHtml(noteInnerHtml) {
    const h2M = noteInnerHtml.match(/<h2>([\s\S]*?)<\/h2>/i);
    const title = h2M ? stripTagsToCleanInline(h2M[1]) : 'Target VM Credentials';
    const entryChunks = [];
    const entryRe = /<div\s+class=["']lab-note-entry["'][^>]*>([\s\S]*?)<\/div>/gi;
    let em;
    while ((em = entryRe.exec(noteInnerHtml)) !== null) {
      entryChunks.push(em[1]);
    }
    if (entryChunks.length === 0) entryChunks.push(noteInnerHtml);

    const list = [];
    entryChunks.forEach(function (chunk) {
      const entry = createDefaultCredentialEntry();
      const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let lm;
      while ((lm = liRe.exec(chunk)) !== null) {
        const plain = stripTagsToCleanInline(lm[1]).replace(/<[^>]+>/g, '');
        if (/Target\s*System\s*:/i.test(plain)) {
          entry.targetSystem = plain.replace(/^.*Target\s*System\s*:\s*/i, '').trim();
        } else if (/Username\s*:/i.test(plain)) {
          entry.username = plain.replace(/^.*Username\s*:\s*/i, '').trim();
        } else if (/Password\s*:/i.test(plain)) {
          entry.password = plain.replace(/^.*Password\s*:\s*/i, '').trim();
        } else if (/Details\s*:/i.test(plain)) {
          entry.note = stripTagsToCleanInline(lm[1]).replace(/^.*?<strong>\s*Details:\s*<\/strong>\s*/i, '').trim();
        }
      }
      if (entry.targetSystem || entry.username || entry.password || entry.note) {
        list.push(entry);
      }
    });
    return { title: title, list: list };
  }

  function extractStructuredDataTables(containerHtml) {
    const tables = [];
    const re = /(?:<div\s+class=["']vlp-table-title["'][^>]*>([\s\S]*?)<\/div>\s*)?<table\s+class=["']vlp-data-table["'][^>]*>([\s\S]*?)<\/table>/gi;
    let m;
    while ((m = re.exec(containerHtml)) !== null) {
      const title = m[1] ? stripTagsToCleanInline(m[1]) : '';
      const tblInner = m[2];
      const hasHeader = /<thead\b/i.test(tblInner);
      const rows = [];
      const trRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
      let rm;
      while ((rm = trRe.exec(tblInner)) !== null) {
        const cells = [];
        const cellRe = /<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi;
        let cm;
        while ((cm = cellRe.exec(rm[1])) !== null) {
          cells.push(stripTagsToCleanInline(cm[1]));
        }
        if (cells.length) rows.push(cells);
      }
      if (rows.length > 0) {
        tables.push(createDefaultTable({ title: title, hasHeader: hasHeader, rows: rows }));
      }
    }
    return tables;
  }

  function extractDivBlocksByClass(html, className) {
    const results = [];
    const openRe = new RegExp('<div\\b[^>]*\\bclass=["\'][^"\']*\\b' + className + '\\b[^"\']*["\'][^>]*>', 'gi');
    const divTokenRe = /<div\b[^>]*>|<\/div>/gi;
    let m;
    while ((m = openRe.exec(html)) !== null) {
      const startIdx = m.index;
      const innerStart = startIdx + m[0].length;
      divTokenRe.lastIndex = innerStart;
      let depth = 1;
      let endIdx = -1;
      let innerEnd = -1;
      let tm;
      while ((tm = divTokenRe.exec(html)) !== null) {
        if (tm[0].toLowerCase().startsWith('</div')) {
          depth--;
          if (depth === 0) {
            innerEnd = tm.index;
            endIdx = tm.index + tm[0].length;
            break;
          }
        } else {
          depth++;
        }
      }
      if (endIdx !== -1) {
        results.push({
          full: html.slice(startIdx, endIdx),
          inner: html.slice(innerStart, innerEnd)
        });
        openRe.lastIndex = endIdx;
      }
    }
    return results;
  }

  function stripDivBlocksByClass(html, className) {
    let out = String(html || '');
    const blocks = extractDivBlocksByClass(out, className);
    blocks.forEach(function (blk) {
      out = out.replace(blk.full, '');
    });
    return out;
  }

  /**
   * Parses an already-formatted or legacy HTML string into a structured node state.
   */
  function parseHtmlToNodeState(rawHtml, nodeTitle, nodeImages) {
    const html = String(rawHtml || '').trim();
    const attachedImages = Array.isArray(nodeImages) ? nodeImages : [];

    // 1. Course Overview format (.course-overview)
    if (/<div\s+class=["']course-overview["'][^>]*>/i.test(html)) {
      const data = createDefaultOverviewData();
      const h1Match = html.match(/<div\s+class=["']course-header["'][^>]*>[\s\S]*?<h1>([\s\S]*?)<\/h1>[\s\S]*?<\/div>/i);
      if (h1Match) data.courseTitle = stripTagsToCleanInline(h1Match[1]);

      const bannerMatch = html.match(/<div\s+class=["']banner-container["'][^>]*>[\s\S]*?<img\b([^>]*)>[\s\S]*?<\/div>/i);
      if (bannerMatch) {
        const attrs = parseXmlAttributes(bannerMatch[1]);
        data.bannerSrc = decodeXmlEntities(attrs.src || '');
        data.bannerAlt = decodeXmlEntities(attrs.alt || 'Course Banner');
      }

      data.showDivider = /<hr\s+class=["']section-divider["']/i.test(html);
      data.tables = extractStructuredDataTables(html);

      const purposeBlocks = extractDivBlocksByClass(html, 'purpose-card');
      if (purposeBlocks.length > 0) {
        data.purposeEnabled = true;
        const pH2 = purposeBlocks[0].inner.match(/<h2>([\s\S]*?)<\/h2>/i);
        if (pH2) data.purposeTitle = stripTagsToCleanInline(pH2[1]);
        const pList = [];
        const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        let pm;
        while ((pm = pRe.exec(purposeBlocks[0].inner)) !== null) {
          const t = stripTagsToCleanInline(pm[1]);
          if (t) pList.push(t);
        }
        data.purposeText = pList.join('\n\n');
      }

      const credBlocks = extractDivBlocksByClass(html, 'lab-note');
      if (credBlocks.length > 0) {
        const parsedCred = parseLabNoteHtml(credBlocks[0].inner);
        data.credentialsEnabled = true;
        data.credentialsTitle = parsedCred.title;
        data.credentialsList = parsedCred.list;
      }

      let bodyOnly = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
      bodyOnly = stripDivBlocksByClass(bodyOnly, 'course-header');
      bodyOnly = stripDivBlocksByClass(bodyOnly, 'banner-container');
      bodyOnly = stripDivBlocksByClass(bodyOnly, 'purpose-card');
      bodyOnly = stripDivBlocksByClass(bodyOnly, 'lab-note');
      bodyOnly = bodyOnly.replace(/(?:<div\s+class=["']vlp-table-title["'][^>]*>[\s\S]*?<\/div>\s*)?<table\s+class=["']vlp-data-table["'][^>]*>[\s\S]*?<\/table>/gi, '');

      const ovBlocks = [];
      const blkRe = /<(p|ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi;
      let bm;
      while ((bm = blkRe.exec(bodyOnly)) !== null) {
        if (bm[1].toLowerCase() === 'p') {
          const t = stripTagsToCleanInline(bm[2]);
          if (t) ovBlocks.push(t);
        } else {
          const t = stripTagsToCleanInline(bm[0]);
          if (t) ovBlocks.push(t);
        }
      }
      data.overviewText = ovBlocks.join('\n\n');

      return { mode: 'overview', overview: data, stepsData: createDefaultStepsData(), rawHtml: html };
    }

    // 2. Procedural Steps format (.lab-wrapper)
    const hasCustomNonSpec = /<(?:div)\s+class=["'](?:ref-gallery|verify-card|remed-card)["']/i.test(html);
    if (/<div\s+class=["']lab-wrapper["'][^>]*>/i.test(html) && /<table\s+class=["']lab-table["']/i.test(html) && !hasCustomNonSpec) {
      const data = createDefaultStepsData();
      const h3Match = html.match(/<div\s+class=["']lab-header["'][^>]*>[\s\S]*?<h3>([\s\S]*?)<\/h3>[\s\S]*?<\/div>/i);
      if (h3Match) data.sectionTitle = stripTagsToCleanInline(h3Match[1]);

      const beforeTable = html.split(/<table\s+class=["']lab-table["']/i)[0] || '';
      data.tables = extractStructuredDataTables(beforeTable);

      const pageCredBlocks = extractDivBlocksByClass(beforeTable, 'lab-note');
      if (pageCredBlocks.length > 0) {
        const pc = parseLabNoteHtml(pageCredBlocks[0].inner);
        data.credentialsEnabled = true;
        data.credentialsTitle = pc.title;
        data.credentialsList = pc.list;
      }

      let introClean = beforeTable.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
      introClean = stripDivBlocksByClass(introClean, 'lab-header');
      introClean = stripDivBlocksByClass(introClean, 'lab-note');
      introClean = introClean.replace(/(?:<div\s+class=["']vlp-table-title["'][^>]*>[\s\S]*?<\/div>\s*)?<table\s+class=["']vlp-data-table["'][^>]*>[\s\S]*?<\/table>/gi, '');

      const introBlocks = [];
      const ipRe = /<(p|ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi;
      let ipm;
      while ((ipm = ipRe.exec(introClean)) !== null) {
        const t = stripTagsToCleanInline(ipm[1].toLowerCase() === 'p' ? ipm[2] : ipm[0]);
        if (t) introBlocks.push(t);
      }
      data.introText = introBlocks.join('\n\n');

      const labTableSection = html.slice(html.search(/<table\s+class=["']lab-table["']/i));
      const tbodyMatch = labTableSection.match(/<tbody>([\s\S]*)<\/tbody>/i);
      const steps = [];
      if (tbodyMatch) {
        const trChunks = tbodyMatch[1].split(/<tr>\s*<td\b[^>]*>\s*<span\s+class=["']step-badge["'][^>]*>\d+<\/span>\s*<\/td>\s*<td>/i);
        for (let i = 1; i < trChunks.length; i++) {
          const cellHtml = trChunks[i].replace(/<\/td>\s*<\/tr>\s*$/i, '');
          const step = createDefaultStep();

          const ctxBlocks = extractDivBlocksByClass(cellHtml, 'step-context');
          if (ctxBlocks.length > 0) {
            step.contextText = stripTagsToCleanInline(ctxBlocks[0].inner);
          }

          const stepCredBlocks = extractDivBlocksByClass(cellHtml, 'lab-note');
          if (stepCredBlocks.length > 0) {
            step.credentialsList = parseLabNoteHtml(stepCredBlocks[0].inner).list;
          }

          step.tables = extractStructuredDataTables(cellHtml);

          const termBlocks = extractDivBlocksByClass(cellHtml, 'term-box');
          if (termBlocks.length > 0) {
            let termHtml = termBlocks[0].inner;
            const promptMatch = termHtml.match(/<span\s+class=["']term-prompt["'][^>]*>([\s\S]*?)<\/span>/i);
            if (promptMatch) {
              step.termPrompt = decodeXmlEntities(promptMatch[1].replace(/<[^>]+>/g, '')).trim();
              termHtml = termHtml.replace(promptMatch[0], '');
            }
            const termLines = termHtml
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<[^>]+>/g, '')
              .split('\n')
              .map(function (l) { return decodeXmlEntities(l).trim(); });
            if (promptMatch && termLines.length > 0 && termLines[0]) {
              step.termCommand = termLines[0];
              step.termOutput = termLines.slice(1).filter(function (l, idx, arr) {
                return idx < arr.length - 1 || l !== '';
              }).join('\n').trim();
            } else {
              step.termOutput = termLines.filter(Boolean).join('\n');
            }
          }

          step.images = extractImagesFromHtml(cellHtml);

          let instHtml = stripDivBlocksByClass(cellHtml, 'step-context');
          instHtml = stripDivBlocksByClass(instHtml, 'lab-note');
          instHtml = stripDivBlocksByClass(instHtml, 'term-box');
          instHtml = instHtml
            .replace(/(?:<div\s+class=["']vlp-table-title["'][^>]*>[\s\S]*?<\/div>\s*)?<table\s+class=["']vlp-data-table["'][^>]*>[\s\S]*?<\/table>/gi, '')
            .replace(/<img\b[^>]*>/gi, '');
          step.instruction = stripTagsToCleanInline(instHtml);
          steps.push(step);
        }
      }
      data.steps = steps.length ? steps : [createDefaultStep()];
      return { mode: 'steps', overview: createDefaultOverviewData(), stepsData: data, rawHtml: html };
    }

    if (!html) {
      return { mode: 'steps', overview: createDefaultOverviewData(), stepsData: createDefaultStepsData(), rawHtml: '' };
    }
    return {
      mode: 'raw',
      overview: createDefaultOverviewData(),
      stepsData: createDefaultStepsData(),
      rawHtml: html,
      legacyImages: attachedImages
    };
  }

  /**
   * Converts a legacy HTML node into a structured Step object, preserving legacy HTML tables into step.tables[].
   */
  function convertLegacyContentToStep(html, title, nodeImages) {
    const step = createDefaultStep();
    const blocks = extractLegacyBlockElements(html);
    const htmlImgs = extractImagesFromHtml(html);
    const seenSrc = {};
    const mergedImgs = [];
    htmlImgs.forEach(function (im) {
      if (!seenSrc[im.src]) {
        seenSrc[im.src] = true;
        mergedImgs.push(im);
      }
    });
    (nodeImages || []).forEach(function (im) {
      const src = im.src || (im.filename ? './images/' + im.filename : '');
      if (src && !seenSrc[src]) {
        seenSrc[src] = true;
        mergedImgs.push({ src: src, alt: title || '', width: im.width || '', height: im.height || '' });
      }
    });
    step.images = mergedImgs;

    const instParts = [];
    const ctxParts = [];
    let pendingTableTitle = '';

    blocks.forEach(function (blk, idx) {
      if (blk.type === 'p' || blk.type === 'div' || /^h[1-6]$/.test(blk.type)) {
        const plain = blk.text.replace(/<\/?strong>/gi, '').trim();
        const whatM = plain.match(/^What you are doing:\s*([\s\S]*)$/i);
        const whyM = plain.match(/^Why this matters:\s*([\s\S]*)$/i);
        if (whatM) {
          ctxParts.push(blk.text.replace(/^<strong>\s*What you are doing:\s*<\/strong>\s*/i, '').replace(/^What you are doing:\s*/i, '').trim());
        } else if (whyM) {
          ctxParts.push(blk.text.replace(/^<strong>\s*Why this matters:\s*<\/strong>\s*/i, '').replace(/^Why this matters:\s*/i, '').trim());
        } else if (blk.text.trim()) {
          // If this short bold line immediately precedes a table (like NDSACESXI01 in Annex C), use it as table title
          const nextBlk = blocks[idx + 1];
          if (nextBlk && nextBlk.type === 'table' && plain.length < 40) {
            pendingTableTitle = plain;
          } else {
            instParts.push(blk.text.trim());
          }
        }
      } else if (blk.type === 'ul' || blk.type === 'ol') {
        blk.items.forEach(function (it, i) {
          instParts.push((blk.type === 'ol' ? (i + 1) + '. ' : '• ') + it);
        });
      } else if (blk.type === 'table') {
        step.tables.push(createDefaultTable({
          title: pendingTableTitle,
          hasHeader: Boolean(blk.hasHeader),
          rows: blk.rows
        }));
        pendingTableTitle = '';
      }
    });

    step.contextText = ctxParts.filter(Boolean).join('\n');

    let instruction = instParts.join('\n');
    const cleanTitle = stripZeroWidthAndNbsp(title || '').trim();
    if (cleanTitle && !/^step\s*\d+/i.test(cleanTitle)) {
      const lowerInst = instruction.toLowerCase();
      if (lowerInst.indexOf(cleanTitle.toLowerCase()) !== 0) {
        instruction = '<strong>' + escapeHtmlPreserveEntities(cleanTitle) + ':</strong> ' + instruction;
      }
    }
    step.instruction = instruction;
    return step;
  }

  function convertLegacyNodeToOverview(node) {
    const html = node.rawHtml || generateNodeHtml(node);
    const data = createDefaultOverviewData();
    const blocks = extractLegacyBlockElements(html);
    const imgs = extractImagesFromHtml(html);
    if (imgs.length > 0) {
      data.bannerSrc = imgs[0].src;
      data.bannerAlt = imgs[0].alt || node.title || 'Overview Banner';
    } else if (node.images && node.images.length > 0) {
      data.bannerSrc = node.images[0].src || ('./images/' + node.images[0].filename);
      data.bannerAlt = node.title || 'Overview Banner';
    }
    const paras = [];
    blocks.forEach(function (blk) {
      if (blk.type === 'ul' || blk.type === 'ol') {
        const tag = blk.type;
        paras.push('<' + tag + '>\n' + blk.items.map(function (it) { return '  <li>' + it + '</li>'; }).join('\n') + '\n</' + tag + '>');
      } else if (blk.type === 'table') {
        data.tables.push(createDefaultTable({
          title: '',
          hasHeader: Boolean(blk.hasHeader),
          rows: blk.rows
        }));
      } else if (blk.text) {
        paras.push(blk.text);
      }
    });
    data.overviewText = paras.join('\n\n');
    data.showDivider = false;
    return data;
  }

  function consolidateChapterSteps(chapterNode) {
    if (!chapterNode) return null;
    const children = Array.isArray(chapterNode.children) ? chapterNode.children : [];
    const targetChildren = children.filter(function (c) { return c.mode !== 'steps'; });
    const sourceChildren = targetChildren.length > 0 ? targetChildren : children;
    if (sourceChildren.length === 0) return chapterNode;

    const cloned = JSON.parse(JSON.stringify(chapterNode));
    if (cloned.mode === 'raw' && (cloned.rawHtml || '').trim()) {
      cloned.overview = convertLegacyNodeToOverview(cloned);
      cloned.mode = 'overview';
      cloned.rawHtml = '';
    }

    const consolidatedSteps = [];
    sourceChildren.forEach(function (child) {
      if (child.mode === 'steps' && child.stepsData && Array.isArray(child.stepsData.steps)) {
        child.stepsData.steps.forEach(function (st) {
          consolidatedSteps.push(migrateStepData(JSON.parse(JSON.stringify(st))));
        });
      } else {
        const html = child.rawHtml || generateNodeHtml(child);
        consolidatedSteps.push(convertLegacyContentToStep(html, child.title, child.images));
      }
    });

    const mergedChildImages = [];
    const seen = {};
    consolidatedSteps.forEach(function (st) {
      (st.images || []).forEach(function (im) {
        const fname = extractFilenameFromSrc(im.src);
        if (fname && !seen[fname]) {
          seen[fname] = true;
          mergedChildImages.push({
            src: './images/' + fname,
            filename: fname,
            width: im.width || '',
            height: im.height || ''
          });
        }
      });
    });

    const consolidatedNode = {
      id: generateUuid(),
      title: 'Step 1',
      languageCode: cloned.languageCode || 'en',
      mode: 'steps',
      overview: createDefaultOverviewData(),
      stepsData: Object.assign(createDefaultStepsData(), {
        sectionTitle: stripZeroWidthAndNbsp(cloned.title || 'Lab Procedure').trim(),
        introText: '',
        steps: consolidatedSteps.length ? consolidatedSteps : [createDefaultStep()]
      }),
      rawHtml: '',
      images: mergedChildImages,
      children: []
    };

    const remainingFormatted = targetChildren.length > 0
      ? cloned.children.filter(function (c) { return c.mode === 'steps'; })
      : [];
    cloned.children = [consolidatedNode].concat(remainingFormatted);
    return cloned;
  }

  /* =========================================================================
   * Pure-JS Recursive XML Parser & Serializer (VLP content.xml Schema)
   * ========================================================================= */
  function parseXmlAttributes(attrStr) {
    const attrs = {};
    const re = /([a-zA-Z0-9_:-]+)\s*=\s*(?:'([^']*)'|"([^"]*)")/g;
    let m;
    while ((m = re.exec(attrStr || '')) !== null) {
      attrs[m[1]] = decodeXmlEntities(m[2] !== undefined ? m[2] : (m[3] || ''));
    }
    return attrs;
  }

  function parseXmlDocument(xmlString) {
    const src = String(xmlString || '').replace(/^\uFEFF/, '');
    let pos = 0;
    const len = src.length;

    function skipIgnorable() {
      while (pos < len) {
        if (/\s/.test(src[pos])) {
          pos++;
        } else if (src.startsWith('<?', pos)) {
          const end = src.indexOf('?>', pos + 2);
          pos = end === -1 ? len : end + 2;
        } else if (src.startsWith('<!--', pos)) {
          const end = src.indexOf('-->', pos + 4);
          pos = end === -1 ? len : end + 3;
        } else {
          break;
        }
      }
    }

    function parseElement() {
      skipIgnorable();
      if (pos >= len || src[pos] !== '<') return null;
      if (src.startsWith('</', pos)) return null;

      pos++;
      const nameStart = pos;
      while (pos < len && !/[\s/>]/.test(src[pos])) pos++;
      const tagName = src.slice(nameStart, pos);

      const attrStart = pos;
      let quote = null;
      while (pos < len) {
        const ch = src[pos];
        if (quote) {
          if (ch === quote) quote = null;
        } else {
          if (ch === '"' || ch === "'") quote = ch;
          else if (ch === '>') break;
        }
        pos++;
      }
      const rawAttrSlice = src.slice(attrStart, pos);
      const selfClosing = rawAttrSlice.trim().endsWith('/');
      const attrs = parseXmlAttributes(selfClosing ? rawAttrSlice.replace(/\/\s*$/, '') : rawAttrSlice);
      if (pos < len && src[pos] === '>') pos++;

      const node = { tag: tagName, attrs: attrs, children: [], text: '' };
      if (selfClosing) return node;

      let textBuf = '';
      while (pos < len) {
        if (src.startsWith('<!--', pos)) {
          const end = src.indexOf('-->', pos + 4);
          pos = end === -1 ? len : end + 3;
        } else if (src.startsWith('<![CDATA[', pos)) {
          const end = src.indexOf(']]>', pos + 9);
          if (end === -1) {
            textBuf += src.slice(pos + 9);
            pos = len;
          } else {
            textBuf += src.slice(pos + 9, end);
            pos = end + 3;
          }
        } else if (src.startsWith('</', pos)) {
          const closeEnd = src.indexOf('>', pos + 2);
          pos = closeEnd === -1 ? len : closeEnd + 1;
          break;
        } else if (src[pos] === '<') {
          const child = parseElement();
          if (child) node.children.push(child);
        } else {
          const nextLt = src.indexOf('<', pos);
          if (nextLt === -1) {
            textBuf += src.slice(pos);
            pos = len;
          } else {
            textBuf += src.slice(pos, nextLt);
            pos = nextLt;
          }
        }
      }
      node.text = decodeXmlEntities(textBuf);
      return node;
    }

    return parseElement();
  }

  function findChild(el, tagName) {
    if (!el || !el.children) return null;
    for (let i = 0; i < el.children.length; i++) {
      if (el.children[i].tag === tagName) return el.children[i];
    }
    return null;
  }

  function findChildren(el, tagName) {
    if (!el || !el.children) return [];
    return el.children.filter(function (c) { return c.tag === tagName; });
  }

  function xmlContentNodeToModel(xmlNode) {
    const id = xmlNode.attrs.id || generateUuid();
    const titleEl = findChild(xmlNode, 'title');
    const orderEl = findChild(xmlNode, 'orderIndex');
    const childrenWrap = findChild(xmlNode, 'children');
    const locsWrap = findChild(xmlNode, 'localizations');
    const locEl = locsWrap ? findChild(locsWrap, 'LocaleContent') : null;

    const title = (locEl && findChild(locEl, 'title') ? findChild(locEl, 'title').text : (titleEl ? titleEl.text : 'Untitled')) || 'Untitled';
    const languageCode = (locEl && findChild(locEl, 'languageCode') ? findChild(locEl, 'languageCode').text : 'en') || 'en';
    const contentEl = locEl ? findChild(locEl, 'content') : null;
    const rawHtml = contentEl ? contentEl.text : '';

    const imagesWrap = locEl ? findChild(locEl, 'images') : null;
    const images = imagesWrap ? findChildren(imagesWrap, 'img').map(function (imgEl) {
      return {
        src: imgEl.attrs.src || '',
        filename: imgEl.attrs.filename || extractFilenameFromSrc(imgEl.attrs.src || ''),
        width: imgEl.attrs.width || '',
        height: imgEl.attrs.height || ''
      };
    }) : [];

    const parsedState = parseHtmlToNodeState(rawHtml, title, images);
    const childNodes = childrenWrap
      ? findChildren(childrenWrap, 'ContentNode').map(xmlContentNodeToModel)
      : [];

    childNodes.sort(function (a, b) { return (a.orderIndex || 0) - (b.orderIndex || 0); });

    return {
      id: id,
      title: title,
      orderIndex: orderEl ? Number(orderEl.text) || 0 : 0,
      languageCode: languageCode,
      mode: parsedState.mode,
      overview: parsedState.overview,
      stepsData: parsedState.stepsData,
      rawHtml: parsedState.rawHtml,
      images: images,
      children: childNodes
    };
  }

  function parseXmlToManual(xmlString) {
    const root = parseXmlDocument(xmlString);
    if (!root || root.tag !== 'Manual') {
      throw new Error('Invalid VLP content.xml: missing <Manual> root element.');
    }
    const nameEl = findChild(root, 'name');
    const langEl = findChild(root, 'defaultLanguageCode');
    const fmtEl = findChild(root, 'dataFormat');
    const nodesWrap = findChild(root, 'contentNodes');
    const topNodes = nodesWrap ? findChildren(nodesWrap, 'ContentNode').map(xmlContentNodeToModel) : [];
    topNodes.sort(function (a, b) { return (a.orderIndex || 0) - (b.orderIndex || 0); });

    let inferredTheme = 'crimson-slate';
    if (topNodes[0] && topNodes[0].rawHtml) {
      inferredTheme = inferColorThemeFromHtml(topNodes[0].rawHtml);
    }

    return {
      id: root.attrs.id || generateUuid(),
      name: (nameEl ? nameEl.text : 'vlp.manual') || 'vlp.manual',
      defaultLanguageCode: (langEl ? langEl.text : 'en') || 'en',
      dataFormat: (fmtEl ? fmtEl.text : 'default') || 'default',
      colorTheme: inferredTheme,
      contentNodes: topNodes
    };
  }

  function collectNodeImagesForXml(node, html, imageMetaLookup) {
    const meta = imageMetaLookup || {};
    const existingByFilename = {};
    (node.images || []).forEach(function (im) {
      const fn = im.filename || extractFilenameFromSrc(im.src);
      if (fn) existingByFilename[fn] = im;
    });

    const result = [];
    const seen = {};
    const imgMatches = extractImagesFromHtml(html || '');
    imgMatches.forEach(function (im) {
      if (!im.src || !im.src.startsWith('./images/')) return;
      const fn = extractFilenameFromSrc(im.src);
      if (!fn || seen[fn]) return;
      seen[fn] = true;
      const ex = existingByFilename[fn] || {};
      const globalMeta = meta[fn] || meta['./images/' + fn] || {};
      result.push({
        src: './images/' + fn,
        filename: fn,
        width: im.width || ex.width || (globalMeta.width != null ? String(globalMeta.width) : ''),
        height: im.height || ex.height || (globalMeta.height != null ? String(globalMeta.height) : '')
      });
    });
    return result;
  }

  function serializeContentNodeToXml(node, orderIndex, indent, defaultLang, imageMetaLookup, colorTheme) {
    const lines = [];
    const pad = ' '.repeat(indent);
    const id = node.id || generateUuid();
    const title = node.title || 'Untitled';
    const lang = node.languageCode || defaultLang || 'en';
    const html = generateNodeHtml(node, { imageMode: 'vlp', colorTheme: colorTheme });
    const xmlImages = collectNodeImagesForXml(node, html, imageMetaLookup);

    lines.push(pad + "<ContentNode id='" + escapeXmlAttr(id) + "'>");
    lines.push(pad + '  <title>' + escapeXmlText(title) + '</title>');
    lines.push(pad + '  <orderIndex>' + String(orderIndex) + '</orderIndex>');

    if (Array.isArray(node.children) && node.children.length > 0) {
      lines.push(pad + '  <children>');
      node.children.forEach(function (child, idx) {
        lines.push(serializeContentNodeToXml(child, idx, indent + 4, lang, imageMetaLookup, colorTheme));
      });
      lines.push(pad + '  </children>');
    }

    lines.push(pad + '  <localizations>');
    lines.push(pad + "    <LocaleContent id='" + escapeXmlAttr(id) + "'>");
    lines.push(pad + '      <title>' + escapeXmlText(title) + '</title>');
    lines.push(pad + '      <languageCode>' + escapeXmlText(lang) + '</languageCode>');
    if (xmlImages.length > 0) {
      lines.push(pad + '      <images>');
      xmlImages.forEach(function (im) {
        lines.push(
          pad +
          "        <img src='" + escapeXmlAttr(im.src) +
          "' filename='" + escapeXmlAttr(im.filename) +
          "' width='" + escapeXmlAttr(im.width || '') +
          "' height='" + escapeXmlAttr(im.height || '') + "' />"
        );
      });
      lines.push(pad + '      </images>');
    }
    lines.push(pad + '      <content>' + escapeXmlText(html) + '</content>');
    lines.push(pad + '    </LocaleContent>');
    lines.push(pad + '  </localizations>');
    lines.push(pad + '</ContentNode>');
    return lines.join('\n');
  }

  function serializeManualToXml(manual, imageMetaLookup) {
    const m = manual || {};
    const lang = m.defaultLanguageCode || 'en';
    const colorTheme = m.colorTheme || 'crimson-slate';
    const lines = [];
    lines.push("<Manual id='" + escapeXmlAttr(m.id || generateUuid()) + "'>");
    lines.push('  <name>' + escapeXmlText(m.name || 'vlp.manual') + '</name>');
    lines.push('  <defaultLanguageCode>' + escapeXmlText(lang) + '</defaultLanguageCode>');
    lines.push('  <dataFormat>' + escapeXmlText(m.dataFormat || 'default') + '</dataFormat>');
    lines.push('  <contentNodes>');
    (m.contentNodes || []).forEach(function (node, idx) {
      lines.push(serializeContentNodeToXml(node, idx, 4, lang, imageMetaLookup, colorTheme));
    });
    lines.push('  </contentNodes>');
    lines.push('</Manual>');
    return lines.join('\n');
  }

  /* =========================================================================
   * Offline Pre-Made Templates & Toolbar Button Demonstration Catalog
   * ========================================================================= */
  function getToolbarCatalog() {
    return [
      {
        id: 'ui-target',
        category: 'inline',
        label: 'UI Target',
        shortcut: '**Text** or [ui]Text[/ui]',
        tagPreview: '<span class="ui-target">...</span>',
        summary: 'Highlights buttons, icons, menus, window names, and VM names in bold theme-accent text.',
        whenToUse: 'Use for any clickable GUI element, panel, dialog title, or target VM hostname.',
        demoHtml: 'Click <span class="ui-target">Server Manager</span> on <span class="ui-target">NDSACDC01</span> and select <span class="ui-target">Local Server</span>.',
        insertWrap: ['<span class="ui-target">', '</span>'],
        defaultPlaceholder: 'Server Manager'
      },
      {
        id: 'cmd-inline',
        category: 'inline',
        label: 'Command / Credential',
        shortcut: '`command`',
        tagPreview: '<code class="cmd-inline">...</code>',
        summary: 'Renders CLI commands, tools, usernames, and passwords in a dark pill with high-contrast monospace text.',
        whenToUse: 'Use for executable commands (gpedit.msc, whoami, sudo), hostnames in CLI, usernames, and passwords.',
        demoHtml: 'Run <code class="cmd-inline">gpedit.msc</code> using account <code class="cmd-inline">xadministrator</code>.',
        insertWrap: ['<code class="cmd-inline">', '</code>'],
        defaultPlaceholder: 'gpedit.msc'
      },
      {
        id: 'key-press',
        category: 'inline',
        label: 'Key Press',
        shortcut: '[[Key]]',
        tagPreview: '<kbd class="key-press">...</kbd>',
        summary: 'Formats keyboard keys and shortcuts as adaptive keycap badges.',
        whenToUse: 'Use for physical keys or combinations such as Enter, Esc, Spacebar, or Windows Key + R.',
        demoHtml: 'Press <kbd class="key-press">Windows Key + R</kbd>, then press <kbd class="key-press">Enter</kbd>.',
        insertWrap: ['<kbd class="key-press">', '</kbd>'],
        defaultPlaceholder: 'Enter'
      },
      {
        id: 'bold',
        category: 'text',
        label: 'Bold (Ctrl+B)',
        shortcut: 'Ctrl+B',
        tagPreview: '<strong>...</strong>',
        summary: 'Applies strong bold emphasis to selected words.',
        whenToUse: 'Use to emphasize key terms or requirements inside narrative paragraphs.',
        demoHtml: 'Ensure you select <strong>Apply and Reboot</strong> before closing.',
        insertWrap: ['<strong>', '</strong>'],
        defaultPlaceholder: 'important text'
      },
      {
        id: 'italic',
        category: 'text',
        label: 'Italic (Ctrl+I)',
        shortcut: 'Ctrl+I',
        tagPreview: '<em>...</em>',
        summary: 'Italicizes selected words or technical terms.',
        whenToUse: 'Use for definitions, notes, or secondary emphasis.',
        demoHtml: 'This setting configures the server\'s <em>Fully Qualified Domain Name</em>.',
        insertWrap: ['<em>', '</em>'],
        defaultPlaceholder: 'emphasized term'
      },
      {
        id: 'underline',
        category: 'text',
        label: 'Underline (Ctrl+U)',
        shortcut: 'Ctrl+U',
        tagPreview: '<u>...</u>',
        summary: 'Underlines selected words inside any text field.',
        whenToUse: 'Use sparingly to call attention to critical parameters.',
        demoHtml: 'Always verify the <u>exact subnet mask</u> prior to applying.',
        insertWrap: ['<u>', '</u>'],
        defaultPlaceholder: 'underlined text'
      },
      {
        id: 'strike',
        category: 'text',
        label: 'Strikethrough',
        shortcut: 'Ctrl+Shift+S',
        tagPreview: '<s>...</s>',
        summary: 'Strikes through deprecated options or superseded values.',
        whenToUse: 'Use to show old values replaced by new configuration settings.',
        demoHtml: 'Replace legacy IP <s>192.168.10.99</s> with <code class="cmd-inline">192.168.10.11</code>.',
        insertWrap: ['<s>', '</s>'],
        defaultPlaceholder: 'deprecated value'
      },
      {
        id: 'highlight',
        category: 'text',
        label: 'Highlight Text',
        shortcut: 'Toolbar button',
        tagPreview: '<mark class="vlp-highlight">...</mark>',
        summary: 'Shades selected words with the active color theme highlight tint.',
        whenToUse: 'Use to draw immediate visual focus to a crucial phrase inside a sentence.',
        demoHtml: 'Verify <mark class="vlp-highlight">NTP sync is Active</mark> before joining the domain.',
        insertWrap: ['<mark class="vlp-highlight">', '</mark>'],
        defaultPlaceholder: 'highlighted note'
      },
      {
        id: 'ul-list',
        category: 'text',
        label: 'Bullet List',
        shortcut: 'Toolbar button',
        tagPreview: '<ul><li>...</li></ul>',
        summary: 'Converts selected lines into a dark-mode compatible bulleted list.',
        whenToUse: 'Use for grouping related prerequisites or verification checkpoints.',
        demoHtml: '<ul><li>Verify IPv4 connectivity</li><li>Confirm DNS lookup</li></ul>'
      },
      {
        id: 'ol-list',
        category: 'text',
        label: 'Numbered List',
        shortcut: 'Toolbar button',
        tagPreview: '<ol><li>...</li></ol>',
        summary: 'Converts selected lines into an ordered numbered sub-list.',
        whenToUse: 'Use for ordered sub-items inside a step or overview.',
        demoHtml: '<ol><li>Select Network Adapter</li><li>Assign Static IPv4</li></ol>'
      },
      {
        id: 'course-header',
        category: 'overview',
        label: 'Course Header (H1)',
        shortcut: 'Course Overview field',
        tagPreview: '<div class="course-header"><h1>...</h1></div>',
        summary: 'Centered bold accent H1 banner heading at the top of a Course Overview or Introduction page.',
        whenToUse: 'Use at the top of a manual root page or standalone course introduction.',
        demoHtml: '<div class="course-header" style="margin-bottom:0.5rem;"><h1>WINDOWS SERVER 2022</h1></div>'
      },
      {
        id: 'banner-img',
        category: 'overview',
        label: 'Banner Image',
        shortcut: 'Banner Image uploader',
        tagPreview: '<div class="banner-container"><img class="banner-img" ... /></div>',
        summary: 'Responsive rounded hero graphic centered beneath the Course Header.',
        whenToUse: 'Use for a lab banner or architecture illustration on an overview page.',
        demoHtml: '<div class="banner-container" style="margin:0.25rem 0;"><img class="banner-img" src="./assets/banner-sample.svg" alt="Banner Preview" style="max-height:110px;" /></div>'
      },
      {
        id: 'section-divider',
        category: 'overview',
        label: 'Section Divider',
        shortcut: 'Toggle HR Divider',
        tagPreview: '<hr class="section-divider" />',
        summary: 'Subtle horizontal rule separating narrative overview text from callout cards.',
        whenToUse: 'Place between introductory paragraphs and the Instructional Purpose or Credentials card.',
        demoHtml: '<hr class="section-divider" style="margin:0.75rem 0;" />'
      },
      {
        id: 'purpose-card',
        category: 'overview',
        label: 'Instructional Purpose Card',
        shortcut: 'Red Box Rule #1',
        tagPreview: '<div class="purpose-card"><h2>INSTRUCTIONAL PURPOSE</h2>...</div>',
        summary: 'Adaptive translucent callout box reserved for Instructional Purpose at the start of a manual.',
        whenToUse: 'At the beginning of a manual to explain course objectives and training audience.',
        demoHtml: '<div class="purpose-card" style="margin:0.25rem 0;"><h2>INSTRUCTIONAL PURPOSE</h2><p>Explains why this annex exists and what students will master.</p></div>'
      },
      {
        id: 'lab-note',
        category: 'overview',
        label: 'Target VM Credentials Card',
        shortcut: '+ VM Creds (Multiple Systems)',
        tagPreview: '<div class="lab-note"><h2>Target VM Credentials</h2><ul>...</ul></div>',
        summary: 'Adaptive callout box supporting single or multiple target VM systems on Overviews, Step headers, and inside individual Steps.',
        whenToUse: 'Use whenever introducing one or more virtual machines and their login credentials.',
        demoHtml: '<div class="lab-note" style="margin:0.25rem 0;"><h2>Target VM Credentials</h2><div class="lab-note-entry"><ul><li><strong>Target System:</strong> <span class="ui-target">NDSACDC01</span></li><li><strong>Username:</strong> <code class="cmd-inline">xadministrator</code></li><li><strong>Password:</strong> <code class="cmd-inline">M@rines1M@rines1</code></li></ul></div><div class="lab-note-entry"><ul><li><strong>Target System:</strong> <span class="ui-target">NDSACESXI01</span></li><li><strong>Username:</strong> <code class="cmd-inline">root</code></li><li><strong>Password:</strong> <code class="cmd-inline">M@rines1M@rines1</code></li></ul></div></div>'
      },
      {
        id: 'data-table',
        category: 'steps',
        label: 'Data Table (.vlp-data-table)',
        shortcut: '+ Table button',
        tagPreview: '<table class="vlp-data-table">...</table>',
        summary: 'Structured multi-column table that works on Overview, Chapter, and inside individual Step cells.',
        whenToUse: 'Use to present IP matrices, port assignments, VLANs, or multi-system parameters cleanly.',
        demoHtml: '<div class="vlp-table-title" style="margin-top:0;">NDSACESXI01 IP Settings</div><table class="vlp-data-table" style="margin:4px 0 0 0;"><thead><tr><th>Setting</th><th>Value</th></tr></thead><tbody><tr><td>IPv4 Address</td><td><code class="cmd-inline">192.168.10.11</code></td></tr><tr><td>Subnet Mask</td><td><code class="cmd-inline">255.255.255.0</code></td></tr></tbody></table>'
      },
      {
        id: 'lab-header',
        category: 'steps',
        label: 'Lab Section Header (H3)',
        shortcut: 'Section Title field',
        tagPreview: '<div class="lab-header"><h3>...</h3></div>',
        summary: 'Accent left-bordered H3 header introducing a procedural task page.',
        whenToUse: 'Top of every procedural step page inside .lab-wrapper.',
        demoHtml: '<div class="lab-header" style="margin-bottom:0.25rem;"><h3>Access Server Manager and Configure Time</h3></div>'
      },
      {
        id: 'lab-table',
        category: 'steps',
        label: 'Procedural Step Row',
        shortcut: '+ Add Step button',
        tagPreview: '<table class="lab-table">...<span class="step-badge">1</span>...</table>',
        summary: 'Responsive alternating-row table with circular step number badges and Action & Verification column.',
        whenToUse: 'Use for all numbered student procedures to preserve strict step fidelity and dark-mode contrast.',
        demoHtml: '<table class="lab-table" style="margin-top:0;"><thead><tr><th style="width:12%;text-align:center;">Step</th><th style="width:88%;">Action &amp; Verification</th></tr></thead><tbody><tr><td style="text-align:center;"><span class="step-badge">1</span></td><td>Open <span class="ui-target">Server Manager</span> and run <code class="cmd-inline">whoami</code>.</td></tr></tbody></table>'
      },
      {
        id: 'step-context',
        category: 'steps',
        label: 'Context Highlight Block',
        shortcut: '+ Context button',
        tagPreview: '<div class="step-context">...</div>',
        summary: 'Indented, theme-shaded highlight block nested inside a step cell without auto-filled labels.',
        whenToUse: 'Use to explain why an action matters, highlight tips, or call out operational context.',
        demoHtml: '<div class="step-context" style="margin-top:0;">Group Policy manages domain and server security baselines across Windows Server hosts.</div>'
      },
      {
        id: 'term-box',
        category: 'steps',
        label: 'Terminal Output Box',
        shortcut: 'Terminal Verification fields',
        tagPreview: '<div class="term-box"><span class="term-prompt">...</span> ...</div>',
        summary: 'High-contrast dark terminal panel with bright shell prompt for expected CLI verification output.',
        whenToUse: 'Place inside a step row to show the exact prompt, command, and expected verification output.',
        demoHtml: '<div class="term-box" style="margin-top:0;"><span class="term-prompt">[admin@host ~]$</span> whoami<br />admin</div>'
      },
      {
        id: 'step-inline-img',
        category: 'steps',
        label: 'Inline Step Image',
        shortcut: 'Paste / Upload Screenshot',
        tagPreview: '<img class="step-inline-img" src="..." alt="..." />',
        summary: 'Screenshot embedded directly inside the matching step table cell beneath instructions.',
        whenToUse: 'Always map screenshots 1-to-1 inline inside their corresponding step row rather than stacking at the bottom.',
        demoHtml: '<img class="step-inline-img" src="./assets/step-sample.svg" alt="Step Screenshot Preview" style="margin-top:0; max-height:110px;" />'
      },
      {
        id: 'raw-text-converter',
        category: 'steps',
        label: 'Raw Text -> Procedural Steps Converter (Native, No AI)',
        shortcut: 'Show Converter button (Steps Editor)',
        tagPreview: '1. Action... / Context:... / ```term ... ```',
        summary: 'Deterministically converts raw pasted prose or numbered instructions into VLP steps without AI. Starts hidden by default; multi-line wrapped paragraphs stay intact unless separated by a step number (1. or Step 1:) or blank line, and live validation flags unclosed ** / ` / [[ ]] / ``` fences or binary file pastes.',
        whenToUse: 'Click Show Converter at the top of Procedural Steps whenever pasting plain text or copied lab instructions. Leave Split Mode on Smart to keep wrapped body text together; use Numbered Only or Blank-Line Paragraphs for manual control, or Line-by-Line for quick one-line lists.',
        demoHtml:
          '<div style="font-size:12px; margin-bottom:8px;"><strong>How Splitting Works:</strong> ' +
          '(1) Lines starting with <code>1.</code>, <code>2)</code>, or <code>Step 1:</code> start a new step and group all wrapped/indented lines below them until the next number. ' +
          '(2) Without step numbers, text only splits on <strong>blank lines</strong> (or bullet lists)—single line wraps are rejoined into smooth prose instead of breaking paragraphs. ' +
          '(3) Optional markers: <code># Section Title</code>, <code>Intro:</code>, <code>Context:</code> / <code>Note:</code>, <code>```term</code> blocks, <code>**UI**</code>, <code>`cmd`</code>, and <code>[[Key]]</code>.</div>' +
          '<table class="lab-table" style="margin-top:0;"><thead><tr><th class="col-step-num" style="width:68px;text-align:center;">Step</th><th style="width:auto;">Action &amp; Verification</th></tr></thead><tbody><tr><td style="text-align:center;"><span class="step-badge">1</span></td><td>Click <span class="ui-target">Start</span>, type <code class="cmd-inline">gpedit.msc</code>, and press <kbd class="key-press">Enter</kbd>. Even when pasted across multiple wrapped lines, the paragraph stays intact.<div class="step-context">Converted deterministically from <code>Context:</code> without breaking prose mid-sentence.</div></td></tr></tbody></table>'
      }
    ];
  }

  function getTemplates() {
    return [
      {
        id: 'course-overview',
        name: 'Course Overview & Instructional Purpose',
        badge: 'Layout 1',
        description: 'Front-page introduction with Course Header, Banner Image, overview text, Section Divider, and Instructional Purpose box.',
        nodeTitle: 'Course Overview',
        mode: 'overview',
        overview: {
          courseTitle: 'WINDOWS SERVER 2022',
          bannerSrc: './images/banner-sample.svg',
          bannerAlt: 'Windows Server Administration Overview',
          overviewText:
            'Windows Server is the backbone operating system used across enterprise networks to manage identity, DNS, and core infrastructure services. In this lab, you will navigate <span class="ui-target">Server Manager</span>, configure system time, and verify baseline tools using <code class="cmd-inline">gpedit.msc</code> and <code class="cmd-inline">whoami</code>.',
          tables: [],
          showDivider: true,
          purposeEnabled: true,
          purposeTitle: 'INSTRUCTIONAL PURPOSE',
          purposeText:
            'This annex is developed for hands-on instructional use.\n\nIt provides a structured, step-by-step workflow for configuring baseline server settings, navigating <span class="ui-target">Server Manager</span>, and verifying administrative privileges.',
          credentialsEnabled: false,
          credentialsTitle: 'Target VM Credentials',
          credentialsList: []
        },
        stepsData: createDefaultStepsData()
      },
      {
        id: 'vm-credentials',
        name: 'Multi-System VM Credentials',
        badge: 'Multi-VM Creds',
        description: 'Announcement introducing multiple target VMs (e.g., Domain Controller + ESXi Host) in a single structured credentials card.',
        nodeTitle: 'Target VM Login',
        mode: 'overview',
        overview: {
          courseTitle: '',
          bannerSrc: '',
          bannerAlt: '',
          overviewText:
            'Use the virtual machine credentials below when switching between <span class="ui-target">NDSACDC01</span> and <span class="ui-target">NDSACESXI01</span> during this module.',
          tables: [],
          showDivider: false,
          purposeEnabled: false,
          purposeTitle: 'INSTRUCTIONAL PURPOSE',
          purposeText: '',
          credentialsEnabled: true,
          credentialsTitle: 'Target VM Credentials',
          credentialsList: [
            createDefaultCredentialEntry({
              targetSystem: 'NDSACDC01',
              username: 'xadministrator',
              password: 'M@rines1M@rines1',
              note: 'Primary Domain Controller (192.168.40.2)'
            }),
            createDefaultCredentialEntry({
              targetSystem: 'NDSACESXI01',
              username: 'root',
              password: 'M@rines1M@rines1',
              note: 'ESXi Management Host (192.168.10.11)'
            })
          ]
        },
        stepsData: createDefaultStepsData()
      },
      {
        id: 'procedural-steps',
        name: 'Procedural Steps Table',
        badge: 'Layout 2',
        description: 'Standard .lab-wrapper exercise demonstrating Step Badges, Context Highlight, Data Tables, VM Creds in steps, Terminal Output, and Inline Images.',
        nodeTitle: 'Step 1',
        mode: 'steps',
        overview: createDefaultOverviewData(),
        stepsData: {
          sectionTitle: 'Configure Static Addressing & Verify Administrative Context',
          introText:
            'In this exercise, you will assign static IPv4 parameters, launch the <span class="ui-target">Local Group Policy Editor</span>, and verify your active session.',
          credentialsEnabled: false,
          credentialsTitle: 'Target VM Credentials',
          credentialsList: [],
          tables: [],
          steps: [
            {
              id: 'tpl-step-1',
              instruction: 'Press <kbd class="key-press">Windows Key + R</kbd>, type <code class="cmd-inline">gpedit.msc</code>, and press <kbd class="key-press">Enter</kbd>.',
              contextText: 'Group Policy controls security baselines and firewall rules on Windows Server.',
              termPrompt: '',
              termCommand: '',
              termOutput: '',
              credentialsList: [],
              tables: [],
              images: [{ src: './images/step-sample.svg', alt: 'Opening Local Group Policy Editor' }]
            },
            {
              id: 'tpl-step-2',
              instruction: 'Configure the static network values shown below on <span class="ui-target">NDSACESXI01</span>:',
              contextText: '',
              termPrompt: '',
              termCommand: '',
              termOutput: '',
              credentialsList: [],
              tables: [
                createDefaultTable({
                  title: 'NDSACESXI01 Network Parameters',
                  hasHeader: true,
                  rows: [
                    ['Setting', 'Value'],
                    ['IPv4 Address', '<code class="cmd-inline">192.168.10.11</code>'],
                    ['Subnet Mask', '<code class="cmd-inline">255.255.255.0</code>'],
                    ['Default Gateway', '<code class="cmd-inline">192.168.10.1</code>']
                  ]
                })
              ],
              images: []
            },
            {
              id: 'tpl-step-3',
              instruction: 'Open <span class="ui-target">Windows PowerShell</span> and verify the active account by typing <code class="cmd-inline">whoami</code> and pressing <kbd class="key-press">Enter</kbd>.',
              contextText: '',
              termPrompt: '[admin@host ~]$',
              termCommand: 'whoami',
              termOutput: 'admin',
              credentialsList: [],
              tables: [],
              images: []
            }
          ]
        }
      },
      {
        id: 'all-buttons-showcase',
        name: 'All-Buttons Interactive Showcase',
        badge: 'Demo',
        description: 'Demonstrates every rich text button, inline semantic tag, nested table, multi-VM credentials card, context block, terminal box, and inline screenshot.',
        nodeTitle: 'All-Buttons Showcase',
        mode: 'steps',
        overview: createDefaultOverviewData(),
        stepsData: {
          sectionTitle: 'VLP Formatter v0.2.0 All-Buttons Showcase',
          introText:
            'Demonstrates <span class="ui-target">UI Target</span>, <code class="cmd-inline">Command</code>, <kbd class="key-press">Key Press</kbd>, <strong>Bold</strong>, <em>Italic</em>, <u>Underline</u>, <s>Strikethrough</s>, <mark class="vlp-highlight">Highlight</mark>, lists, nested tables, multi-VM credentials, context shading, and screenshots.',
          credentialsEnabled: false,
          credentialsTitle: 'Target VM Credentials',
          credentialsList: [],
          tables: [],
          steps: [
            {
              id: 'demo-step-1',
              instruction: '<strong>Text &amp; Semantic Tags:</strong> Click <span class="ui-target">Start</span>, replace <s>old-host</s> with <mark class="vlp-highlight">NDSACDC01</mark>, or press <kbd class="key-press">Windows Key + R</kbd>.<ul><li>Verify <em>primary</em> adapter link</li><li>Confirm <u>static</u> IPv4 settings</li></ul>',
              contextText: 'Indented shaded context block: highlights important notes without forcing fixed prefix labels.',
              termPrompt: '',
              termCommand: '',
              termOutput: '',
              credentialsList: [],
              tables: [],
              images: []
            },
            {
              id: 'demo-step-2',
              instruction: '<strong>Nested Step Table &amp; Step VM Creds:</strong> Connect using the host details below and run <code class="cmd-inline">whoami /groups</code>.',
              contextText: '',
              termPrompt: 'PS C:\\Users\\xadministrator>',
              termCommand: 'whoami /groups',
              termOutput: 'NDSACDC01\\xadministrator\nBUILTIN\\Administrators',
              credentialsList: [
                createDefaultCredentialEntry({
                  targetSystem: 'NDSACDC01',
                  username: 'xadministrator',
                  password: 'M@rines1M@rines1'
                }),
                createDefaultCredentialEntry({
                  targetSystem: 'NDSACDC02',
                  username: 'xadministrator',
                  password: 'M@rines1M@rines1'
                })
              ],
              tables: [
                createDefaultTable({
                  title: 'Domain Controller Addressing',
                  hasHeader: true,
                  rows: [
                    ['Host', 'IPv4 Address', 'Role'],
                    ['NDSACDC01', '<code class="cmd-inline">192.168.40.2</code>', 'Primary DC'],
                    ['NDSACDC02', '<code class="cmd-inline">192.168.40.3</code>', 'Secondary DC']
                  ]
                })
              ],
              images: []
            },
            {
              id: 'demo-step-3',
              instruction: 'Inline Image Demo: Compare your active console view with the reference screenshot directly inside this step cell.',
              contextText: '',
              termPrompt: '',
              termCommand: '',
              termOutput: '',
              credentialsList: [],
              tables: [],
              images: [{ src: './images/step-sample.svg', alt: 'Inline Step Screenshot Example' }]
            }
          ]
        }
      }
    ];
  }

  /* =========================================================================
   * Multi-Format Student Exports (.html, .mdx, .rtf, .pdf)
   * ========================================================================= */

  /**
   * Flattens manual contentNodes in reading order with hierarchical numbering.
   */
  function collectExportNodes(manual, scope, activeNodeId) {
    const items = [];
    const rootNodes = (manual && Array.isArray(manual.contentNodes)) ? manual.contentNodes : [];

    function walk(nodes, prefix, depth, parents) {
      (nodes || []).forEach(function (n, idx) {
        const numLabel = prefix ? (prefix + '.' + (idx + 1)) : String(idx + 1);
        const trail = parents.concat([n.title || ('Section ' + numLabel)]);
        items.push({
          node: n,
          numberLabel: numLabel,
          depth: depth,
          breadcrumb: trail.join(' > ')
        });
        walk(n.children || [], numLabel, depth + 1, trail);
      });
    }

    walk(rootNodes, '', 0, []);
    if (scope === 'current') {
      const matched = items.find(function (it) { return it.node && it.node.id === activeNodeId; });
      if (matched) return [matched];
      return items.length ? [items[0]] : [];
    }
    return items;
  }

  function hexToRgb(hex) {
    const clean = String(hex || '#dc2626').replace('#', '');
    const full = clean.length === 3
      ? clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2]
      : clean.padEnd(6, '0').slice(0, 6);
    const num = parseInt(full, 16);
    const r = Number.isNaN(num) ? 220 : ((num >> 16) & 255);
    const g = Number.isNaN(num) ? 38 : ((num >> 8) & 255);
    const b = Number.isNaN(num) ? 38 : (num & 255);
    return { r255: r, g255: g, b255: b, r: r / 255, g: g / 255, b: b / 255 };
  }

  /**
   * Tokenizes VLP inline markup or legacy HTML into styled text runs for MDX, RTF, and PDF.
   */
  function tokenizeInlineRuns(rawText, options) {
    const opts = options || {};
    let html = String(rawText == null ? '' : rawText);
    if (!html.trim()) return [];

    if (opts.isRawHtml) {
      html = html
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<(?:p|div|h[1-6]|tr)\b[^>]*>/gi, '')
        .replace(/<\/(?:p|div|h[1-6]|tr)>/gi, '\n\n')
        .replace(/<(?:th|td)\b[^>]*>/gi, '  ')
        .replace(/<\/(?:th|td)>/gi, ' | ');
    } else {
      html = formatInlineMarkup(html);
    }

    html = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li\b[^>]*>/gi, '\n• ')
      .replace(/<\/li>/gi, '')
      .replace(/<\/(?:ul|ol)>/gi, '\n')
      .replace(/<(?:ul|ol)\b[^>]*>/gi, '');

    const runs = [];
    const stack = [];
    const tagRe = /<\/?([a-zA-Z0-9]+)\b([^>]*)>/g;
    let lastIdx = 0;
    let m;

    function currentStyle() {
      const s = { bold: false, italic: false, underline: false, strike: false, highlight: false, ui: false, cmd: false, kbd: false };
      stack.forEach(function (item) {
        Object.keys(item.flags).forEach(function (k) {
          if (item.flags[k]) s[k] = true;
        });
      });
      return s;
    }

    function pushText(rawChunk) {
      if (!rawChunk) return;
      const decoded = stripZeroWidthAndNbsp(decodeXmlEntities(rawChunk));
      if (!decoded) return;
      const style = currentStyle();
      runs.push(Object.assign({ text: decoded }, style));
    }

    while ((m = tagRe.exec(html)) !== null) {
      if (m.index > lastIdx) {
        pushText(html.slice(lastIdx, m.index));
      }
      const isClose = m[0].startsWith('</');
      const tag = m[1].toLowerCase();
      const attrs = m[2] || '';
      if (isClose) {
        for (let i = stack.length - 1; i >= 0; i--) {
          if (stack[i].tag === tag) {
            stack.splice(i, 1);
            break;
          }
        }
      } else if (!m[0].endsWith('/>')) {
        const flags = {};
        if (tag === 'strong' || tag === 'b') flags.bold = true;
        else if (tag === 'em' || tag === 'i') flags.italic = true;
        else if (tag === 'u') flags.underline = true;
        else if (tag === 's' || tag === 'strike' || tag === 'del') flags.strike = true;
        else if (tag === 'mark') flags.highlight = true;
        else if (tag === 'code') flags.cmd = true;
        else if (tag === 'kbd') flags.kbd = true;
        else if (tag === 'span' && /\bui-target\b/i.test(attrs)) {
          flags.ui = true;
          flags.bold = true;
        }
        stack.push({ tag: tag, flags: flags });
      }
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < html.length) {
      pushText(html.slice(lastIdx));
    }
    return runs;
  }

  function resolveRawHtmlFallbackData(node) {
    const raw = String((node && node.rawHtml) || '');
    const parsed = parseHtmlToNodeState(raw, node && node.title, node && node.images);
    if (parsed && (parsed.mode === 'overview' || parsed.mode === 'steps')) {
      return parsed;
    }
    const plainRuns = tokenizeInlineRuns(raw, { isRawHtml: true });
    return { mode: 'raw-text', text: plainRuns.map(function (r) { return r.text; }).join('').trim() };
  }

  /**
   * Generates a standalone offline HTML5 student manual (Full Manual or Current Page).
   */
  function generateStandaloneManualHtml(manual, options) {
    const opts = options || {};
    const scope = opts.scope === 'current' ? 'current' : 'full';
    const colorTheme = opts.colorTheme || (manual && manual.colorTheme) || 'crimson-slate';
    const theme = getColorTheme(colorTheme);
    const items = collectExportNodes(manual, scope, opts.activeNodeId);
    const manualTitle = stripZeroWidthAndNbsp((manual && manual.name) || 'VLP Lab Manual');

    const renderedSections = items.map(function (it, idx) {
      let nodeHtml = generateNodeHtml(it.node, {
        imageMode: 'base64',
        imageMap: opts.imageMap || {},
        samplePrefix: opts.samplePrefix || '',
        colorTheme: colorTheme
      });
      // Strip duplicate embedded <style> inside each section; master CSS sits in <head> once
      nodeHtml = nodeHtml.replace(/<style\b[^>]*>[\s\S]*?<\/style>\s*/i, '');
      const secId = 'sec-' + (idx + 1);
      const tocLabel = escapeHtmlPreserveEntities(it.numberLabel + '. ' + (it.node.title || 'Section'));
      return {
        id: secId,
        tocLabel: tocLabel,
        depth: it.depth,
        breadcrumb: escapeHtmlPreserveEntities(it.breadcrumb),
        bodyHtml: nodeHtml
      };
    });

    const tocHtml = renderedSections.length > 1
      ? '<nav class="student-toc" aria-label="Manual Contents"><h2>Contents</h2><ul>' +
        renderedSections.map(function (s) {
          const pad = Math.min(s.depth, 3) * 16;
          return '<li style="margin-left:' + pad + 'px;"><a href="#' + s.id + '">' + s.tocLabel + '</a></li>';
        }).join('\n') +
        '</ul></nav>'
      : '';

    const sectionsHtml = renderedSections.map(function (s, idx) {
      const divider = idx > 0 ? '<div class="student-section-break"></div>' : '';
      return divider +
        '<section id="' + s.id + '" class="student-section">\n' +
        '  <div class="student-breadcrumb">' + s.breadcrumb + '</div>\n' +
        s.bodyHtml + '\n' +
        '</section>';
    }).join('\n');

    return [
      '<!DOCTYPE html>',
      '<html lang="' + escapeHtml((manual && manual.defaultLanguageCode) || 'en') + '" class="theme-light">',
      '<head>',
      '  <meta charset="UTF-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      '  <title>' + escapeHtmlPreserveEntities(manualTitle) + ' — Student Guide</title>',
      getMasterStyleBlock(colorTheme),
      '  <style>',
      '    :root { --stu-bg: #f8fafc; --stu-surface: #ffffff; --stu-border: #e2e8f0; --stu-text: #1e293b; --stu-muted: #64748b; }',
      '    html.theme-dark { --stu-bg: #141920; --stu-surface: #1b2129; --stu-border: #2c3746; --stu-text: #e5edf7; --stu-muted: #94a3b8; }',
      '    body { margin: 0; padding: 0; background: var(--stu-bg); color: var(--stu-text); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      '    .student-topbar { position: sticky; top: 0; z-index: 50; background: var(--stu-surface); border-bottom: 1px solid var(--stu-border); padding: 10px 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }',
      '    .student-topbar-title { font-weight: 700; font-size: 15px; color: var(--stu-text); border-left: 4px solid ' + theme.light.accent + '; padding-left: 10px; }',
      '    .student-topbar-actions { display: flex; gap: 8px; }',
      '    .student-btn { padding: 6px 12px; font-size: 12.5px; font-weight: 600; border-radius: 6px; border: 1px solid var(--stu-border); background: transparent; color: var(--stu-text); cursor: pointer; }',
      '    .student-btn-accent { background: ' + theme.light.accent + '; border-color: ' + theme.light.accent + '; color: #ffffff; }',
      '    .student-container { max-width: 980px; margin: 22px auto 48px; padding: 28px 34px; background: var(--stu-surface); border: 1px solid var(--stu-border); border-radius: 10px; }',
      '    .student-toc { background: rgba(128, 128, 128, 0.06); border: 1px solid var(--stu-border); border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; }',
      '    .student-toc h2 { margin: 0 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--stu-muted); }',
      '    .student-toc ul { margin: 0; padding-left: 16px; }',
      '    .student-toc a { color: ' + theme.light.accent + '; text-decoration: none; font-weight: 600; line-height: 1.7; }',
      '    .student-breadcrumb { font-size: 12px; color: var(--stu-muted); margin-bottom: 8px; font-weight: 600; }',
      '    .student-section-break { border-top: 2px dashed var(--stu-border); margin: 32px 0 24px; }',
      '    @media print {',
      '      @page { margin: 0.55in; }',
      '      .student-topbar { display: none !important; }',
      '      body, .student-container { background: #ffffff !important; color: #111827 !important; border: none !important; padding: 0 !important; margin: 0 !important; max-width: 100% !important; }',
      '      .student-section { break-inside: auto; }',
      '      .student-section-break { page-break-before: always; border: none; margin: 0; }',
      '      .lab-table tr, .purpose-card, .lab-note, .term-box, .step-context { break-inside: avoid; }',
      '    }',
      '  </style>',
      '</head>',
      '<body>',
      '  <header class="student-topbar">',
      '    <div class="student-topbar-title">' + escapeHtmlPreserveEntities(manualTitle) + '</div>',
      '    <div class="student-topbar-actions">',
      '      <button type="button" class="student-btn" onclick="document.documentElement.classList.toggle(\'theme-light\');document.documentElement.classList.toggle(\'theme-dark\');document.documentElement.classList.toggle(\'clr-theme-dark\');">Toggle Dark Mode</button>',
      '      <button type="button" class="student-btn student-btn-accent" onclick="window.print();">Print / Save PDF</button>',
      '    </div>',
      '  </header>',
      '  <main class="student-container">',
      tocHtml,
      sectionsHtml,
      '  </main>',
      '</body>',
      '</html>'
    ].join('\n');
  }

  function renderRunsToMdx(rawText, options) {
    const runs = tokenizeInlineRuns(rawText, options);
    return runs.map(function (r) {
      let s = r.text;
      if (!s) return '';
      if (r.cmd) return '`' + s.replace(/`/g, "'") + '`';
      if (r.kbd) return '<kbd>' + escapeHtmlPreserveEntities(s) + '</kbd>';
      if (r.highlight) return '<mark>' + escapeHtmlPreserveEntities(s) + '</mark>';
      if (r.strike) s = '~~' + s + '~~';
      if (r.underline) s = '<u>' + s + '</u>';
      if (r.italic && !r.bold) s = '*' + s + '*';
      if (r.bold || r.ui) s = '**' + s + '**';
      return s;
    }).join('').trim();
  }

  function renderTablesToMdx(tables) {
    if (!Array.isArray(tables) || tables.length === 0) return '';
    return tables.map(function (tbl) {
      const rows = Array.isArray(tbl.rows) ? tbl.rows : [];
      if (!rows.length) return '';
      const out = [];
      if (tbl.title && tbl.title.trim()) {
        out.push('**' + tbl.title.trim() + '**\n');
      }
      const cols = Math.max.apply(null, rows.map(function (r) { return (r || []).length; }).concat([1]));
      const hasHeader = tbl.hasHeader !== false;
      function fmtRow(r) {
        const padded = [];
        for (let c = 0; c < cols; c++) {
          const cell = renderRunsToMdx((r && r[c]) || '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br />');
          padded.push(cell || ' ');
        }
        return '| ' + padded.join(' | ') + ' |';
      }
      if (hasHeader) {
        out.push(fmtRow(rows[0]));
        out.push('| ' + new Array(cols).fill('---').join(' | ') + ' |');
        for (let i = 1; i < rows.length; i++) out.push(fmtRow(rows[i]));
      } else {
        out.push('| ' + new Array(cols).fill(' ').join(' | ') + ' |');
        out.push('| ' + new Array(cols).fill('---').join(' | ') + ' |');
        for (let i = 0; i < rows.length; i++) out.push(fmtRow(rows[i]));
      }
      return out.join('\n');
    }).filter(Boolean).join('\n\n');
  }

  function renderCredsToMdx(title, credList) {
    const entries = (Array.isArray(credList) ? credList : []).filter(function (c) {
      return c && ((c.targetSystem && c.targetSystem.trim()) || (c.username && c.username.trim()) || (c.password && c.password.trim()));
    });
    if (!entries.length) return '';
    const out = ['#### ' + ((title && title.trim()) || 'Target VM Credentials'), '', '| System | Username | Password | Role / IP |', '| --- | --- | --- | --- |'];
    entries.forEach(function (c) {
      out.push('| ' + [
        (c.targetSystem || '-').replace(/\|/g, '\\|'),
        c.username ? '`' + c.username.replace(/`/g, "'") + '`' : '-',
        c.password ? '`' + c.password.replace(/`/g, "'") + '`' : '-',
        (c.note || '-').replace(/\|/g, '\\|')
      ].join(' | ') + ' |');
    });
    return out.join('\n');
  }

  /**
   * Generates a clean .mdx Markdown/MDX document for Full Manual or Current Page.
   */
  function generateManualMdx(manual, options) {
    const opts = options || {};
    const scope = opts.scope === 'current' ? 'current' : 'full';
    const colorTheme = opts.colorTheme || (manual && manual.colorTheme) || 'crimson-slate';
    const items = collectExportNodes(manual, scope, opts.activeNodeId);
    const title = ((manual && manual.name) || 'VLP Manual').replace(/"/g, '\\"');
    const lang = (manual && manual.defaultLanguageCode) || 'en';

    const lines = [
      '---',
      'title: "' + title + '"',
      'manual: "' + title + '"',
      'language: "' + lang.replace(/"/g, '\\"') + '"',
      'theme: "' + colorTheme + '"',
      'scope: "' + scope + '"',
      'exportedAt: "' + new Date().toISOString() + '"',
      '---',
      ''
    ];

    items.forEach(function (it) {
      const hPrefix = '#'.repeat(Math.min(it.depth + 1, 4));
      let node = it.node;
      let mode = node.mode;
      let ov = node.overview;
      let stData = node.stepsData;
      if (mode === 'raw') {
        const fb = resolveRawHtmlFallbackData(node);
        if (fb.mode === 'overview') { mode = 'overview'; ov = fb.overview; }
        else if (fb.mode === 'steps') { mode = 'steps'; stData = fb.stepsData; }
        else {
          lines.push(hPrefix + ' ' + it.numberLabel + '. ' + (node.title || 'Section'), '', fb.text || '', '');
          return;
        }
      }

      if (mode === 'overview') {
        const d = Object.assign(createDefaultOverviewData(), ov || {});
        d.credentialsList = normalizeCredentialsList(d);
        const heading = (d.courseTitle && d.courseTitle.trim()) || node.title || 'Overview';
        lines.push(hPrefix + ' ' + it.numberLabel + '. ' + heading, '');
        if (d.bannerSrc && d.bannerSrc.trim()) {
          const src = resolveImageSrc(d.bannerSrc.trim(), { imageMode: 'vlp', imageMap: opts.imageMap || {} });
          lines.push('![' + (d.bannerAlt || 'Course Banner') + '](' + src + ')', '');
        }
        splitParagraphs(d.overviewText).forEach(function (p) {
          lines.push(renderRunsToMdx(p), '');
        });
        const tMdx = renderTablesToMdx(d.tables);
        if (tMdx) lines.push(tMdx, '');
        if (d.purposeEnabled) {
          lines.push('> **' + ((d.purposeTitle && d.purposeTitle.trim()) || 'INSTRUCTIONAL PURPOSE') + '**');
          splitParagraphs(d.purposeText || 'Purpose details for the course annex.').forEach(function (p) {
            lines.push('> ' + renderRunsToMdx(p).replace(/\n/g, '\n> '));
          });
          lines.push('');
        }
        if (d.credentialsEnabled || d.credentialsList.length > 0) {
          const cMdx = renderCredsToMdx(d.credentialsTitle, d.credentialsList);
          if (cMdx) lines.push(cMdx, '');
        }
      } else {
        const d = Object.assign(createDefaultStepsData(), stData || {});
        d.credentialsList = normalizeCredentialsList(d);
        const heading = (d.sectionTitle && d.sectionTitle.trim()) || node.title || 'Procedure';
        lines.push(hPrefix + ' ' + it.numberLabel + '. ' + heading, '');
        splitParagraphs(d.introText).forEach(function (p) {
          lines.push(renderRunsToMdx(p), '');
        });
        const itMdx = renderTablesToMdx(d.tables);
        if (itMdx) lines.push(itMdx, '');
        if (d.credentialsEnabled || d.credentialsList.length > 0) {
          const pcMdx = renderCredsToMdx(d.credentialsTitle, d.credentialsList);
          if (pcMdx) lines.push(pcMdx, '');
        }
        (d.steps || []).map(migrateStepData).forEach(function (step, idx) {
          lines.push('#### Step ' + (idx + 1), '');
          if (step.instruction && step.instruction.trim()) {
            lines.push(renderRunsToMdx(step.instruction), '');
          }
          if (step.contextText && step.contextText.trim()) {
            lines.push('> ' + renderRunsToMdx(step.contextText).replace(/\n/g, '\n> '), '');
          }
          const scMdx = renderCredsToMdx('Target VM Credentials', step.credentialsList);
          if (scMdx) lines.push(scMdx, '');
          const stMdx = renderTablesToMdx(step.tables);
          if (stMdx) lines.push(stMdx, '');
          const hasTerm = Boolean((step.termPrompt && step.termPrompt.trim()) || (step.termCommand && step.termCommand.trim()) || (step.termOutput && step.termOutput.trim()));
          if (hasTerm) {
            lines.push('```bash');
            if ((step.termPrompt && step.termPrompt.trim()) || (step.termCommand && step.termCommand.trim())) {
              lines.push(((step.termPrompt || '').trim() + ' ' + (step.termCommand || '').trim()).trim());
            }
            if (step.termOutput && step.termOutput.trim()) {
              lines.push(step.termOutput.trim());
            }
            lines.push('```', '');
          }
          (step.images || []).forEach(function (img, imIdx) {
            if (!img || !img.src) return;
            const src = resolveImageSrc(img.src.trim(), { imageMode: 'vlp', imageMap: opts.imageMap || {} });
            const alt = (img.alt && img.alt.trim()) || ('Step ' + (idx + 1) + ' Image ' + (imIdx + 1));
            lines.push('![' + alt + '](' + src + ')', '');
          });
        });
      }
    });

    return lines.join('\n');
  }

  function escapeRtfText(str) {
    let out = '';
    const s = String(str == null ? '' : str);
    for (let i = 0; i < s.length; i++) {
      const code = s.charCodeAt(i);
      const ch = s[i];
      if (ch === '\\' || ch === '{' || ch === '}') {
        out += '\\' + ch;
      } else if (ch === '\n') {
        out += '\\line ';
      } else if (ch === '\r') {
        continue;
      } else if (ch === '\t') {
        out += '\\tab ';
      } else if (code > 127) {
        const signed = code > 32767 ? code - 65536 : code;
        out += '\\u' + signed + '?';
      } else {
        out += ch;
      }
    }
    return out;
  }

  function renderRunsToRtf(rawText, options) {
    const runs = tokenizeInlineRuns(rawText, options);
    return runs.map(function (r) {
      let prefix = '';
      let suffix = '';
      if (r.bold || r.ui) { prefix += '\\b '; suffix = '\\b0 ' + suffix; }
      if (r.italic) { prefix += '\\i '; suffix = '\\i0 ' + suffix; }
      if (r.underline) { prefix += '\\ul '; suffix = '\\ulnone ' + suffix; }
      if (r.strike) { prefix += '\\strike '; suffix = '\\strike0 ' + suffix; }
      if (r.ui) { prefix += '\\cf1 '; suffix = '\\cf2 ' + suffix; }
      if (r.cmd || r.kbd) { prefix += '\\f1\\fs20 '; suffix = '\\f0\\fs22 ' + suffix; }
      if (r.highlight) { prefix += '\\highlight4 '; suffix = '\\highlight0 ' + suffix; }
      return prefix + escapeRtfText(r.text) + suffix;
    }).join('');
  }

  function detectImageDimensionsAndFormat(buf) {
    if (!buf || buf.length < 16) return null;
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 && buf.length >= 24) {
      const w = (buf[16] << 24 | buf[17] << 16 | buf[18] << 8 | buf[19]) >>> 0;
      const h = (buf[20] << 24 | buf[21] << 16 | buf[22] << 8 | buf[23]) >>> 0;
      return { type: 'png', width: w || 320, height: h || 200 };
    }
    // JPEG signature: FF D8
    if (buf[0] === 0xFF && buf[1] === 0xD8) {
      let i = 2;
      while (i + 9 < buf.length) {
        if (buf[i] !== 0xFF) break;
        const marker = buf[i + 1];
        if (marker === 0xD9 || marker === 0xDA) break;
        const segLen = (buf[i + 2] << 8) | buf[i + 3];
        if (marker >= 0xC0 && marker <= 0xC3) {
          const h = (buf[i + 5] << 8) | buf[i + 6];
          const w = (buf[i + 7] << 8) | buf[i + 8];
          const comps = buf[i + 9];
          return { type: 'jpeg', width: w || 320, height: h || 200, components: comps || 3 };
        }
        if (segLen < 2) break;
        i += 2 + segLen;
      }
      return { type: 'jpeg', width: 480, height: 300, components: 3 };
    }
    return null;
  }

  function renderRtfTable(rows, hasHeader, twipsWidth) {
    if (!Array.isArray(rows) || !rows.length) return '';
    const totalW = twipsWidth || 9360; // 6.5 inches
    const cols = Math.max.apply(null, rows.map(function (r) { return (r || []).length; }).concat([1]));
    const colW = Math.floor(totalW / cols);
    const out = [];
    rows.forEach(function (r, rIdx) {
      const isHdr = hasHeader !== false && rIdx === 0;
      let def = '\\trowd\\trgaph108\\trleft0';
      for (let c = 0; c < cols; c++) {
        def += (isHdr ? '\\clcbpat5' : '') +
          '\\clbrdrt\\brdrs\\brdrw10\\brdrcf6\\clbrdrl\\brdrs\\brdrw10\\brdrcf6\\clbrdrb\\brdrs\\brdrw10\\brdrcf6\\clbrdrr\\brdrs\\brdrw10\\brdrcf6' +
          '\\cellx' + ((c + 1) * colW);
      }
      out.push(def);
      let rowCells = '';
      for (let c = 0; c < cols; c++) {
        const cellRtf = renderRunsToRtf((r && r[c]) || '');
        rowCells += '\\pard\\intbl\\f0\\fs20 ' + (isHdr ? '\\b ' + cellRtf + '\\b0 ' : cellRtf) + '\\cell';
      }
      out.push(rowCells + '\\row');
    });
    return out.join('\n') + '\n\\pard\\sa120\\par';
  }

  /**
   * Generates a valid RTF 1.5 document compatible with Word/LibreOffice/WordPad.
   */
  function generateManualRtf(manual, options) {
    const opts = options || {};
    const scope = opts.scope === 'current' ? 'current' : 'full';
    const colorTheme = opts.colorTheme || (manual && manual.colorTheme) || 'crimson-slate';
    const theme = getColorTheme(colorTheme);
    const accentRgb = hexToRgb(theme.light.accent);
    const items = collectExportNodes(manual, scope, opts.activeNodeId);
    const resolvedImages = opts.resolvedImages || {};

    const parts = [
      '{\\rtf1\\ansi\\ansicpg1252\\deff0',
      '{\\fonttbl{\\f0\\fswiss Segoe UI;}{\\f1\\fmodern Consolas;}}',
      '{\\colortbl;' +
        '\\red' + accentRgb.r255 + '\\green' + accentRgb.g255 + '\\blue' + accentRgb.b255 + ';' + // cf1 accent
        '\\red31\\green41\\blue55;' +   // cf2 dark slate text
        '\\red248\\green250\\blue252;' + // cf3 light fill
        '\\red254\\green240\\blue138;' + // cf4 highlight yellow
        '\\red226\\green232\\blue240;' + // cf5 table hdr fill
        '\\red203\\green213\\blue225;' + // cf6 border gray
        '\\red15\\green23\\blue42;' +    // cf7 term bg
        '\\red56\\green189\\blue248;' +  // cf8 term text
      '}',
      '\\viewkind4\\uc1\\pard\\f0\\fs22\\cf2'
    ];

    parts.push('\\pard\\sa140\\fs34\\b\\cf1 ' + escapeRtfText((manual && manual.name) || 'VLP Manual') + '\\b0\\cf2\\par');

    function appendRtfImage(src, alt) {
      const fn = extractFilenameFromSrc(src);
      const buf = resolvedImages[src] || resolvedImages['./images/' + fn] || resolvedImages[fn];
      const meta = buf ? detectImageDimensionsAndFormat(buf) : null;
      if (meta && (meta.type === 'png' || meta.type === 'jpeg')) {
        const maxTwips = 8640; // 6 in
        const wTwips = Math.min(maxTwips, meta.width * 15);
        const hTwips = Math.max(300, Math.round(wTwips * (meta.height / Math.max(1, meta.width))));
        const hex = Array.from(buf).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
        const blip = meta.type === 'png' ? '\\pngblip' : '\\jpegblip';
        parts.push('\\pard\\sa100{\\pict' + blip + '\\picw' + meta.width + '\\pich' + meta.height + '\\picwgoal' + wTwips + '\\pichgoal' + hTwips + ' ' + hex + '}\\par');
      } else if (src) {
        parts.push('\\pard\\sa80\\i\\fs19 [Image: ' + escapeRtfText(alt || fn || src) + ']\\i0\\fs22\\par');
      }
    }

    items.forEach(function (it, itemIdx) {
      if (itemIdx > 0) parts.push('\\pard\\sa120\\par');
      let node = it.node;
      let mode = node.mode;
      let ov = node.overview;
      let stData = node.stepsData;
      if (mode === 'raw') {
        const fb = resolveRawHtmlFallbackData(node);
        if (fb.mode === 'overview') { mode = 'overview'; ov = fb.overview; }
        else if (fb.mode === 'steps') { mode = 'steps'; stData = fb.stepsData; }
        else {
          parts.push('\\pard\\sa120\\fs28\\b\\cf1 ' + escapeRtfText(it.numberLabel + '. ' + (node.title || 'Section')) + '\\b0\\cf2\\fs22\\par');
          parts.push('\\pard\\sa120 ' + renderRunsToRtf(fb.text || '') + '\\par');
          return;
        }
      }

      if (mode === 'overview') {
        const d = Object.assign(createDefaultOverviewData(), ov || {});
        d.credentialsList = normalizeCredentialsList(d);
        parts.push('\\pard\\sa120\\fs28\\b\\cf1 ' + escapeRtfText(it.numberLabel + '. ' + (d.courseTitle || node.title || 'Overview')) + '\\b0\\cf2\\fs22\\par');
        if (d.bannerSrc) appendRtfImage(d.bannerSrc, d.bannerAlt || 'Course Banner');
        splitParagraphs(d.overviewText).forEach(function (p) {
          parts.push('\\pard\\sa120 ' + renderRunsToRtf(p) + '\\par');
        });
        (d.tables || []).forEach(function (tbl) {
          if (tbl.title) parts.push('\\pard\\sa60\\b ' + escapeRtfText(tbl.title) + '\\b0\\par');
          parts.push(renderRtfTable(tbl.rows, tbl.hasHeader !== false));
        });
        if (d.purposeEnabled) {
          parts.push('\\pard\\li240\\sa80\\brdrl\\brdrs\\brdrw45\\brdrcf1\\b\\cf1 ' + escapeRtfText(d.purposeTitle || 'INSTRUCTIONAL PURPOSE') + '\\b0\\cf2\\line ' +
            splitParagraphs(d.purposeText || 'Purpose details for the course annex.').map(function (p) { return renderRunsToRtf(p); }).join('\\line ') + '\\par');
        }
        if (d.credentialsEnabled || d.credentialsList.length > 0) {
          const rows = [['System', 'Username', 'Password', 'Role / IP']];
          d.credentialsList.forEach(function (c) {
            rows.push([c.targetSystem || '-', c.username || '-', c.password || '-', c.note || '-']);
          });
          if (rows.length > 1) {
            parts.push('\\pard\\sa60\\b ' + escapeRtfText(d.credentialsTitle || 'Target VM Credentials') + '\\b0\\par');
            parts.push(renderRtfTable(rows, true));
          }
        }
      } else {
        const d = Object.assign(createDefaultStepsData(), stData || {});
        d.credentialsList = normalizeCredentialsList(d);
        parts.push('\\pard\\sa120\\fs28\\b\\cf1 ' + escapeRtfText(it.numberLabel + '. ' + (d.sectionTitle || node.title || 'Procedure')) + '\\b0\\cf2\\fs22\\par');
        splitParagraphs(d.introText).forEach(function (p) {
          parts.push('\\pard\\sa120 ' + renderRunsToRtf(p) + '\\par');
        });
        (d.tables || []).forEach(function (tbl) {
          if (tbl.title) parts.push('\\pard\\sa60\\b ' + escapeRtfText(tbl.title) + '\\b0\\par');
          parts.push(renderRtfTable(tbl.rows, tbl.hasHeader !== false));
        });
        if (d.credentialsEnabled || d.credentialsList.length > 0) {
          const rows = [['System', 'Username', 'Password', 'Role / IP']];
          d.credentialsList.forEach(function (c) {
            rows.push([c.targetSystem || '-', c.username || '-', c.password || '-', c.note || '-']);
          });
          if (rows.length > 1) {
            parts.push('\\pard\\sa60\\b ' + escapeRtfText(d.credentialsTitle || 'Target VM Credentials') + '\\b0\\par');
            parts.push(renderRtfTable(rows, true));
          }
        }
        (d.steps || []).map(migrateStepData).forEach(function (step, sIdx) {
          parts.push('\\pard\\sa100\\b\\cf1 Step ' + (sIdx + 1) + ': \\b0\\cf2 ' + renderRunsToRtf(step.instruction || '') + '\\par');
          if (step.contextText && step.contextText.trim()) {
            parts.push('\\pard\\li360\\sa80\\brdrl\\brdrs\\brdrw35\\brdrcf1 ' + renderRunsToRtf(step.contextText) + '\\par');
          }
          if (step.credentialsList && step.credentialsList.length) {
            const cRows = [['System', 'Username', 'Password', 'Role / IP']];
            step.credentialsList.forEach(function (c) {
              cRows.push([c.targetSystem || '-', c.username || '-', c.password || '-', c.note || '-']);
            });
            parts.push(renderRtfTable(cRows, true, 8600));
          }
          (step.tables || []).forEach(function (tbl) {
            if (tbl.title) parts.push('\\pard\\li240\\sa40\\b ' + escapeRtfText(tbl.title) + '\\b0\\par');
            parts.push(renderRtfTable(tbl.rows, tbl.hasHeader !== false, 8600));
          });
          if ((step.termPrompt && step.termPrompt.trim()) || (step.termCommand && step.termCommand.trim()) || (step.termOutput && step.termOutput.trim())) {
            const tLine = [((step.termPrompt || '').trim() + ' ' + (step.termCommand || '').trim()).trim(), (step.termOutput || '').trim()].filter(Boolean).join('\n');
            parts.push('\\pard\\li360\\sa80\\f1\\fs19\\cbpat7\\cf8 ' + escapeRtfText(tLine) + '\\f0\\fs22\\cf2\\par');
          }
          (step.images || []).forEach(function (img, imIdx) {
            appendRtfImage(img.src, img.alt || ('Step ' + (sIdx + 1) + ' Image ' + (imIdx + 1)));
          });
        });
      }
    });

    parts.push('}');
    return parts.join('\n');
  }

  /* =========================================================================
   * Pure-JS Binary PDF 1.4 Student Document Generator
   * ========================================================================= */
  function toPdfWinAnsiBytes(str) {
    const s = String(str == null ? '' : str)
      .replace(/\u2022/g, '\x95')
      .replace(/\u2013/g, '\x96')
      .replace(/\u2014/g, '\x97')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\u2026/g, '...')
      .replace(/\u2192/g, '->')
      .replace(/\u2190/g, '<-')
      .replace(/\u2191/g, '^')
      .replace(/\u2193/g, 'v');
    let escaped = '';
    for (let i = 0; i < s.length; i++) {
      const code = s.charCodeAt(i);
      const ch = s[i];
      if (ch === '\\' || ch === '(' || ch === ')') {
        escaped += '\\' + ch;
      } else if (code >= 32 && code <= 126) {
        escaped += ch;
      } else if (code === 0x95 || code === 0x96 || code === 0x97 || (code >= 0xA0 && code <= 0xFF)) {
        escaped += '\\' + code.toString(8).padStart(3, '0');
      } else {
        escaped += ' ';
      }
    }
    return '(' + escaped + ')';
  }

  function measurePdfWidth(str, fontKey, fontSize) {
    const s = String(str || '');
    const isMono = fontKey === 'F4' || fontKey === 'F5';
    const isBold = fontKey === 'F2';
    let units = 0;
    for (let i = 0; i < s.length; i++) {
      if (isMono) {
        units += 0.6;
      } else {
        const ch = s[i];
        if ('il.,;:\'!|[]() '.indexOf(ch) !== -1) units += 0.28;
        else if ('mwMW@#%'.indexOf(ch) !== -1) units += 0.84;
        else if (ch >= 'A' && ch <= 'Z') units += isBold ? 0.68 : 0.64;
        else units += isBold ? 0.56 : 0.52;
      }
    }
    return units * fontSize;
  }

  function decodePngToPdfImage(buf) {
    if (typeof require !== 'function') return null;
    let zlib;
    try { zlib = require('zlib'); } catch (_e) { return null; }
    if (!buf || buf.length < 24) return null;

    let offset = 8;
    let width = 0;
    let height = 0;
    let bitDepth = 8;
    let colorType = 2;
    let interlace = 0;
    let palette = null;
    const idatChunks = [];

    while (offset + 8 <= buf.length) {
      const len = (buf[offset] << 24 | buf[offset + 1] << 16 | buf[offset + 2] << 8 | buf[offset + 3]) >>> 0;
      const type = String.fromCharCode(buf[offset + 4], buf[offset + 5], buf[offset + 6], buf[offset + 7]);
      const dataStart = offset + 8;
      if (dataStart + len > buf.length) break;
      if (type === 'IHDR' && len >= 13) {
        width = (buf[dataStart] << 24 | buf[dataStart + 1] << 16 | buf[dataStart + 2] << 8 | buf[dataStart + 3]) >>> 0;
        height = (buf[dataStart + 4] << 24 | buf[dataStart + 5] << 16 | buf[dataStart + 6] << 8 | buf[dataStart + 7]) >>> 0;
        bitDepth = buf[dataStart + 8];
        colorType = buf[dataStart + 9];
        interlace = buf[dataStart + 12];
      } else if (type === 'PLTE') {
        palette = buf.slice(dataStart, dataStart + len);
      } else if (type === 'IDAT') {
        idatChunks.push(buf.slice(dataStart, dataStart + len));
      } else if (type === 'IEND') {
        break;
      }
      offset = dataStart + len + 4;
    }

    if (!width || !height || bitDepth !== 8 || interlace !== 0 || !idatChunks.length) return null;
    if ([0, 2, 3, 4, 6].indexOf(colorType) === -1) return null;

    const bppMap = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
    const bpp = bppMap[colorType];
    const compressed = Buffer.concat(idatChunks);
    const raw = zlib.inflateSync(compressed);
    const stride = width * bpp;
    const scanlines = new Uint8Array(height * stride);

    function paeth(a, b, c) {
      const p = a + b - c;
      const pa = Math.abs(p - a);
      const pb = Math.abs(p - b);
      const pc = Math.abs(p - c);
      if (pa <= pb && pa <= pc) return a;
      if (pb <= pc) return b;
      return c;
    }

    for (let y = 0; y < height; y++) {
      const inRow = y * (stride + 1);
      const outRow = y * stride;
      if (inRow >= raw.length) break;
      const filter = raw[inRow];
      for (let x = 0; x < stride; x++) {
        const val = raw[inRow + 1 + x] || 0;
        const a = x >= bpp ? scanlines[outRow + x - bpp] : 0;
        const b = y > 0 ? scanlines[outRow - stride + x] : 0;
        const c = (y > 0 && x >= bpp) ? scanlines[outRow - stride + x - bpp] : 0;
        let recon = val;
        if (filter === 1) recon = (val + a) & 0xFF;
        else if (filter === 2) recon = (val + b) & 0xFF;
        else if (filter === 3) recon = (val + ((a + b) >> 1)) & 0xFF;
        else if (filter === 4) recon = (val + paeth(a, b, c)) & 0xFF;
        scanlines[outRow + x] = recon;
      }
    }

    const rgb = new Uint8Array(width * height * 3);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dst = (y * width + x) * 3;
        const src = y * stride + x * bpp;
        if (colorType === 2) {
          rgb[dst] = scanlines[src];
          rgb[dst + 1] = scanlines[src + 1];
          rgb[dst + 2] = scanlines[src + 2];
        } else if (colorType === 6) {
          const alpha = scanlines[src + 3] / 255;
          rgb[dst] = Math.round(scanlines[src] * alpha + 255 * (1 - alpha));
          rgb[dst + 1] = Math.round(scanlines[src + 1] * alpha + 255 * (1 - alpha));
          rgb[dst + 2] = Math.round(scanlines[src + 2] * alpha + 255 * (1 - alpha));
        } else if (colorType === 0) {
          rgb[dst] = rgb[dst + 1] = rgb[dst + 2] = scanlines[src];
        } else if (colorType === 4) {
          const gVal = scanlines[src];
          const alpha = scanlines[src + 1] / 255;
          const v = Math.round(gVal * alpha + 255 * (1 - alpha));
          rgb[dst] = rgb[dst + 1] = rgb[dst + 2] = v;
        } else if (colorType === 3 && palette) {
          const pIdx = scanlines[src] * 3;
          rgb[dst] = palette[pIdx] || 0;
          rgb[dst + 1] = palette[pIdx + 1] || 0;
          rgb[dst + 2] = palette[pIdx + 2] || 0;
        }
      }
    }

    return {
      width: width,
      height: height,
      colorSpace: '/DeviceRGB',
      filter: '/FlateDecode',
      data: zlib.deflateSync(Buffer.from(rgb))
    };
  }

  /**
   * Generates a valid multi-page binary PDF 1.4 Buffer/Uint8Array for Full Manual or Current Page.
   */
  function generateManualPdfBuffer(manual, options) {
    const opts = options || {};
    const scope = opts.scope === 'current' ? 'current' : 'full';
    const colorTheme = opts.colorTheme || (manual && manual.colorTheme) || 'crimson-slate';
    const theme = getColorTheme(colorTheme);
    const accent = hexToRgb(theme.light.accent);
    const items = collectExportNodes(manual, scope, opts.activeNodeId);
    const resolvedImages = opts.resolvedImages || {};

    const PAGE_W = 612;
    const PAGE_H = 792;
    const MARGIN = 44;
    const CONTENT_W = PAGE_W - MARGIN * 2;
    const BOTTOM_Y = 56;

    const pages = [];
    const pdfImages = [];
    let currentOps = null;
    let cursorY = PAGE_H - MARGIN;

    function fNum(n) { return Number(n).toFixed(2); }

    function newPage() {
      currentOps = [];
      pages.push(currentOps);
      cursorY = PAGE_H - MARGIN;
    }

    function ensureSpace(h) {
      if (!currentOps || cursorY - h < BOTTOM_Y) {
        newPage();
      }
    }

    function drawRect(x, yTop, w, h, fillRgb, strokeRgb, lineW) {
      const ops = currentOps;
      ops.push('q');
      if (fillRgb) ops.push(fNum(fillRgb[0]) + ' ' + fNum(fillRgb[1]) + ' ' + fNum(fillRgb[2]) + ' rg');
      if (strokeRgb) ops.push(fNum(strokeRgb[0]) + ' ' + fNum(strokeRgb[1]) + ' ' + fNum(strokeRgb[2]) + ' RG');
      if (lineW) ops.push(fNum(lineW) + ' w');
      ops.push(fNum(x) + ' ' + fNum(yTop - h) + ' ' + fNum(w) + ' ' + fNum(h) + ' re ' + (fillRgb && strokeRgb ? 'B' : (fillRgb ? 'f' : 'S')));
      ops.push('Q');
    }

    function drawTextLine(text, x, yBaseline, fontKey, fontSize, rgb) {
      const col = rgb || [0.12, 0.16, 0.22];
      currentOps.push(
        'BT ' + fNum(col[0]) + ' ' + fNum(col[1]) + ' ' + fNum(col[2]) + ' rg /' + fontKey + ' ' + fNum(fontSize) +
        ' Tf 1 0 0 1 ' + fNum(x) + ' ' + fNum(yBaseline) + ' Tm ' + toPdfWinAnsiBytes(text) + ' Tj ET'
      );
    }

    function wrapRunsToLines(runs, maxWidth, baseFontSize) {
      const fs = baseFontSize || 10.5;
      const lines = [[]];
      let lineW = 0;

      function pushToken(tokText, runStyle) {
        const fontKey = (runStyle.cmd || runStyle.kbd)
          ? (runStyle.bold ? 'F5' : 'F4')
          : (runStyle.bold || runStyle.ui ? 'F2' : (runStyle.italic ? 'F3' : 'F1'));
        const w = measurePdfWidth(tokText, fontKey, fs);
        if (lineW > 0 && lineW + w > maxWidth && tokText.trim() !== '') {
          lines.push([]);
          lineW = 0;
          if (/^\s+$/.test(tokText)) return;
        }
        lines[lines.length - 1].push({
          text: tokText,
          fontKey: fontKey,
          width: w,
          ui: runStyle.ui,
          cmd: runStyle.cmd,
          kbd: runStyle.kbd,
          highlight: runStyle.highlight,
          underline: runStyle.underline,
          strike: runStyle.strike
        });
        lineW += w;
      }

      runs.forEach(function (r) {
        const subLines = String(r.text || '').split('\n');
        subLines.forEach(function (sl, slIdx) {
          if (slIdx > 0) {
            lines.push([]);
            lineW = 0;
          }
          const words = sl.match(/\S+\s*|\s+/g) || [];
          words.forEach(function (w) {
            pushToken(w, r);
          });
        });
      });

      return lines;
    }

    function drawWrappedRuns(runs, x, maxWidth, fontSize, lineHeight, optionsDraw) {
      const dOpts = optionsDraw || {};
      const fs = fontSize || 10.5;
      const lh = lineHeight || (fs * 1.42);
      const wrapped = wrapRunsToLines(runs, maxWidth, fs);
      wrapped.forEach(function (segs) {
        ensureSpace(lh + 2);
        let curX = x;
        const baseline = cursorY - fs;
        segs.forEach(function (seg) {
          if (seg.highlight) {
            drawRect(curX, cursorY - 1, seg.width, lh - 2, [0.996, 0.94, 0.54], null, 0);
          } else if (seg.cmd || seg.kbd) {
            drawRect(curX, cursorY - 1, seg.width, lh - 2, [0.94, 0.96, 0.98], [0.80, 0.84, 0.89], 0.4);
          }
          let col = dOpts.defaultColor || [0.12, 0.16, 0.22];
          if (seg.ui) col = [accent.r * 0.82, accent.g * 0.82, accent.b * 0.82];
          else if (seg.cmd) col = [0.06, 0.15, 0.35];
          drawTextLine(seg.text, curX, baseline, seg.fontKey, fs, col);
          if (seg.underline) {
            drawRect(curX, baseline - 1.5, seg.width, 0.6, col, null, 0);
          }
          if (seg.strike) {
            drawRect(curX, baseline + fs * 0.32, seg.width, 0.6, col, null, 0);
          }
          curX += seg.width;
        });
        cursorY -= lh;
      });
    }

    function drawDataTablePdf(tbl, x, maxWidth) {
      const rows = Array.isArray(tbl.rows) ? tbl.rows : [];
      if (!rows.length) return;
      if (tbl.title && tbl.title.trim()) {
        ensureSpace(20);
        drawTextLine(tbl.title.trim(), x, cursorY - 11, 'F2', 10, [accent.r * 0.8, accent.g * 0.8, accent.b * 0.8]);
        cursorY -= 16;
      }
      const cols = Math.max.apply(null, rows.map(function (r) { return (r || []).length; }).concat([1]));
      const colW = maxWidth / cols;
      const cellPadX = 6;
      const cellFs = 9.2;
      const cellLh = 12.5;

      function renderTableRow(r, isHdr) {
        const cellLineArrays = [];
        let maxLines = 1;
        for (let c = 0; c < cols; c++) {
          const runs = tokenizeInlineRuns((r && r[c]) || '');
          const wrapped = wrapRunsToLines(runs, colW - cellPadX * 2, cellFs);
          cellLineArrays.push(wrapped);
          if (wrapped.length > maxLines) maxLines = wrapped.length;
        }
        const rowH = Math.max(18, maxLines * cellLh + 8);
        if (cursorY - rowH < BOTTOM_Y) {
          newPage();
          if (!isHdr && tbl.hasHeader !== false && rows[0]) {
            renderTableRow(rows[0], true);
          }
        }
        for (let c = 0; c < cols; c++) {
          const cx = x + c * colW;
          const bg = isHdr ? [0.91, 0.94, 0.97] : (rIdxEven ? [0.98, 0.99, 1.0] : [1, 1, 1]);
          drawRect(cx, cursorY, colW, rowH, bg, [0.78, 0.82, 0.88], 0.5);
          const linesForCell = cellLineArrays[c];
          linesForCell.forEach(function (segs, lIdx) {
            let tx = cx + cellPadX;
            const baseline = cursorY - 5 - cellFs - lIdx * cellLh;
            segs.forEach(function (seg) {
              const fk = isHdr ? 'F2' : seg.fontKey;
              drawTextLine(seg.text, tx, baseline, fk, cellFs, [0.12, 0.16, 0.22]);
              tx += seg.width;
            });
          });
        }
        cursorY -= rowH;
      }

      let rIdxEven = false;
      rows.forEach(function (r, rIdx) {
        const isHdr = tbl.hasHeader !== false && rIdx === 0;
        rIdxEven = !isHdr && rIdx % 2 === 1;
        renderTableRow(r, isHdr);
      });
      cursorY -= 8;
    }

    function drawCalloutBox(title, bodyRuns, x, width, bgRgb, barRgb) {
      const innerW = width - 20;
      const lines = wrapRunsToLines(bodyRuns, innerW, 9.8);
      const boxH = (title ? 20 : 6) + Math.max(1, lines.length) * 14 + 8;
      ensureSpace(boxH + 6);
      const topY = cursorY;
      drawRect(x, topY, width, boxH, bgRgb, [0.84, 0.87, 0.91], 0.5);
      drawRect(x, topY, 3.5, boxH, barRgb, null, 0);
      cursorY = topY - 7;
      if (title) {
        drawTextLine(title, x + 12, cursorY - 10, 'F2', 10, [accent.r * 0.85, accent.g * 0.85, accent.b * 0.85]);
        cursorY -= 16;
      }
      drawWrappedRuns(bodyRuns, x + 12, innerW, 9.8, 13.8);
      cursorY = topY - boxH - 8;
    }

    function appendPdfImage(src, alt, x, maxW) {
      const fn = extractFilenameFromSrc(src);
      const buf = resolvedImages[src] || resolvedImages['./images/' + fn] || resolvedImages[fn];
      const meta = buf ? detectImageDimensionsAndFormat(buf) : null;
      let imgObj = null;
      if (meta && buf) {
        if (meta.type === 'jpeg') {
          imgObj = {
            width: meta.width,
            height: meta.height,
            colorSpace: meta.components === 1 ? '/DeviceGray' : (meta.components === 4 ? '/DeviceCMYK' : '/DeviceRGB'),
            filter: '/DCTDecode',
            data: buf
          };
        } else if (meta.type === 'png') {
          try { imgObj = decodePngToPdfImage(buf); } catch (_e) { imgObj = null; }
        }
      }

      if (imgObj) {
        const scale = Math.min(maxW / imgObj.width, 260 / imgObj.height, 0.75);
        const drawW = Math.max(40, imgObj.width * scale);
        const drawH = Math.max(30, imgObj.height * scale);
        ensureSpace(drawH + 12);
        const imName = 'Im' + (pdfImages.length + 1);
        pdfImages.push({ name: imName, spec: imgObj });
        const yBottom = cursorY - drawH;
        drawRect(x, cursorY, drawW, drawH, null, [0.82, 0.86, 0.90], 0.5);
        currentOps.push('q ' + fNum(drawW) + ' 0 0 ' + fNum(drawH) + ' ' + fNum(x) + ' ' + fNum(yBottom) + ' cm /' + imName + ' Do Q');
        cursorY -= (drawH + 8);
      } else if (src) {
        ensureSpace(22);
        drawRect(x, cursorY, Math.min(maxW, 380), 18, [0.96, 0.97, 0.99], [0.82, 0.86, 0.90], 0.5);
        drawTextLine('[Image: ' + (alt || fn || src) + ']', x + 8, cursorY - 12, 'F3', 8.8, [0.38, 0.44, 0.52]);
        cursorY -= 24;
      }
    }

    // Start first page & render cover banner
    newPage();
    drawRect(MARGIN, cursorY, CONTENT_W, 36, [accent.r, accent.g, accent.b], null, 0);
    drawTextLine((manual && manual.name) || 'VLP Student Lab Manual', MARGIN + 12, cursorY - 22, 'F2', 14, [1, 1, 1]);
    drawTextLine(scope === 'current' ? 'Single Page Export' : 'Complete Manual', PAGE_W - MARGIN - 110, cursorY - 22, 'F1', 9.5, [0.95, 0.97, 1]);
    cursorY -= 48;

    items.forEach(function (it, idx) {
      if (idx > 0 && it.depth <= 1 && cursorY < 620) {
        newPage();
      }
      let node = it.node;
      let mode = node.mode;
      let ov = node.overview;
      let stData = node.stepsData;
      if (mode === 'raw') {
        const fb = resolveRawHtmlFallbackData(node);
        if (fb.mode === 'overview') { mode = 'overview'; ov = fb.overview; }
        else if (fb.mode === 'steps') { mode = 'steps'; stData = fb.stepsData; }
        else {
          ensureSpace(28);
          drawTextLine(it.numberLabel + '. ' + (node.title || 'Section'), MARGIN, cursorY - 14, 'F2', 13, [accent.r, accent.g, accent.b]);
          cursorY -= 22;
          drawWrappedRuns(tokenizeInlineRuns(fb.text || ''), MARGIN, CONTENT_W, 10, 14);
          return;
        }
      }

      if (mode === 'overview') {
        const d = Object.assign(createDefaultOverviewData(), ov || {});
        d.credentialsList = normalizeCredentialsList(d);
        const hText = it.numberLabel + '. ' + ((d.courseTitle && d.courseTitle.trim()) || node.title || 'Overview');
        ensureSpace(30);
        drawTextLine(hText, MARGIN, cursorY - 15, 'F2', 14, [accent.r * 0.9, accent.g * 0.9, accent.b * 0.9]);
        drawRect(MARGIN, cursorY - 20, CONTENT_W, 1.2, [accent.r, accent.g, accent.b], null, 0);
        cursorY -= 28;

        if (d.bannerSrc) appendPdfImage(d.bannerSrc, d.bannerAlt || 'Course Banner', MARGIN, CONTENT_W);
        splitParagraphs(d.overviewText).forEach(function (p) {
          drawWrappedRuns(tokenizeInlineRuns(p), MARGIN, CONTENT_W, 10.2, 14.5);
          cursorY -= 5;
        });
        (d.tables || []).forEach(function (tbl) { drawDataTablePdf(tbl, MARGIN, CONTENT_W); });
        if (d.purposeEnabled) {
          drawCalloutBox(
            (d.purposeTitle && d.purposeTitle.trim()) || 'INSTRUCTIONAL PURPOSE',
            tokenizeInlineRuns(d.purposeText || 'Purpose details for the course annex.'),
            MARGIN,
            CONTENT_W,
            [0.98, 0.95, 0.95],
            [accent.r, accent.g, accent.b]
          );
        }
        if (d.credentialsEnabled || d.credentialsList.length > 0) {
          const cRows = [['Target System', 'Username', 'Password', 'Role / IP']];
          d.credentialsList.forEach(function (c) {
            cRows.push([c.targetSystem || '-', c.username || '-', c.password || '-', c.note || '-']);
          });
          if (cRows.length > 1) {
            drawDataTablePdf({ title: d.credentialsTitle || 'Target VM Credentials', hasHeader: true, rows: cRows }, MARGIN, CONTENT_W);
          }
        }
      } else {
        const d = Object.assign(createDefaultStepsData(), stData || {});
        d.credentialsList = normalizeCredentialsList(d);
        const hText = it.numberLabel + '. ' + ((d.sectionTitle && d.sectionTitle.trim()) || node.title || 'Lab Procedure');
        ensureSpace(30);
        drawTextLine(hText, MARGIN, cursorY - 15, 'F2', 13.5, [0.10, 0.14, 0.22]);
        drawRect(MARGIN, cursorY - 20, CONTENT_W, 1, [0.80, 0.84, 0.90], null, 0);
        cursorY -= 28;

        splitParagraphs(d.introText).forEach(function (p) {
          drawWrappedRuns(tokenizeInlineRuns(p), MARGIN, CONTENT_W, 10.2, 14.5);
          cursorY -= 5;
        });
        (d.tables || []).forEach(function (tbl) { drawDataTablePdf(tbl, MARGIN, CONTENT_W); });
        if (d.credentialsEnabled || d.credentialsList.length > 0) {
          const cRows = [['Target System', 'Username', 'Password', 'Role / IP']];
          d.credentialsList.forEach(function (c) {
            cRows.push([c.targetSystem || '-', c.username || '-', c.password || '-', c.note || '-']);
          });
          if (cRows.length > 1) {
            drawDataTablePdf({ title: d.credentialsTitle || 'Target VM Credentials', hasHeader: true, rows: cRows }, MARGIN, CONTENT_W);
          }
        }

        (d.steps || []).map(migrateStepData).forEach(function (step, sIdx) {
          ensureSpace(36);
          const badgeY = cursorY;
          drawRect(MARGIN, badgeY, 22, 18, [accent.r, accent.g, accent.b], null, 0);
          drawTextLine(String(sIdx + 1), MARGIN + (sIdx + 1 >= 10 ? 5 : 8), badgeY - 12.5, 'F2', 10, [1, 1, 1]);

          const bodyX = MARGIN + 30;
          const bodyW = CONTENT_W - 30;
          if (step.instruction && step.instruction.trim()) {
            drawWrappedRuns(tokenizeInlineRuns(step.instruction), bodyX, bodyW, 10.2, 14.5);
            cursorY -= 4;
          } else {
            cursorY -= 20;
          }
          if (step.contextText && step.contextText.trim()) {
            drawCalloutBox(null, tokenizeInlineRuns(step.contextText), bodyX, bodyW, [0.96, 0.96, 0.98], [accent.r, accent.g, accent.b]);
          }
          if (step.credentialsList && step.credentialsList.length) {
            const cRows = [['Target System', 'Username', 'Password', 'Role / IP']];
            step.credentialsList.forEach(function (c) {
              cRows.push([c.targetSystem || '-', c.username || '-', c.password || '-', c.note || '-']);
            });
            drawDataTablePdf({ title: 'Target VM Credentials', hasHeader: true, rows: cRows }, bodyX, bodyW);
          }
          (step.tables || []).forEach(function (tbl) { drawDataTablePdf(tbl, bodyX, bodyW); });
          const hasTerm = Boolean((step.termPrompt && step.termPrompt.trim()) || (step.termCommand && step.termCommand.trim()) || (step.termOutput && step.termOutput.trim()));
          if (hasTerm) {
            const termLines = [];
            if ((step.termPrompt && step.termPrompt.trim()) || (step.termCommand && step.termCommand.trim())) {
              termLines.push(((step.termPrompt || '').trim() + ' ' + (step.termCommand || '').trim()).trim());
            }
            if (step.termOutput && step.termOutput.trim()) {
              step.termOutput.split(/\r?\n/).forEach(function (ol) { termLines.push(ol); });
            }
            const tH = Math.max(22, termLines.length * 12 + 12);
            ensureSpace(tH + 6);
            const tTop = cursorY;
            drawRect(bodyX, tTop, bodyW, tH, [0.06, 0.09, 0.16], [0.20, 0.25, 0.33], 0.8);
            termLines.forEach(function (tl, lIdx) {
              drawTextLine(tl, bodyX + 8, tTop - 14 - lIdx * 12, 'F4', 8.8, [0.22, 0.74, 0.97]);
            });
            cursorY = tTop - tH - 8;
          }
          (step.images || []).forEach(function (img, imIdx) {
            appendPdfImage(img.src, img.alt || ('Step ' + (sIdx + 1) + ' Image ' + (imIdx + 1)), bodyX, bodyW);
          });
          cursorY -= 4;
        });
      }
    });

    // Stamp page footers across all pages
    const totalPages = pages.length;
    pages.forEach(function (ops, pIdx) {
      ops.push('q 0.82 0.85 0.90 RG 0.5 w ' + MARGIN + ' 38 m ' + (PAGE_W - MARGIN) + ' 38 l S Q');
      const leftFooter = ((manual && manual.name) || 'VLP Manual') + '  (Air-Gapped Export)';
      const rightFooter = 'Page ' + (pIdx + 1) + ' of ' + totalPages;
      ops.push('BT 0.45 0.50 0.58 rg /F1 8.5 Tf 1 0 0 1 ' + MARGIN + ' 24 Tm ' + toPdfWinAnsiBytes(leftFooter) + ' Tj ET');
      ops.push('BT 0.45 0.50 0.58 rg /F1 8.5 Tf 1 0 0 1 ' + (PAGE_W - MARGIN - 65) + ' 24 Tm ' + toPdfWinAnsiBytes(rightFooter) + ' Tj ET');
    });

    // Assemble PDF 1.4 binary with exact byte-offset xref table
    const objects = [];
    function addObj(bodyOrChunks) {
      objects.push(bodyOrChunks);
      return objects.length; // 1-based PDF object ID
    }

    const idCatalog = addObj(null); // 1
    const idPages = addObj(null);   // 2
    const fontIds = {
      F1: addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'),
      F2: addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'),
      F3: addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>'),
      F4: addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>'),
      F5: addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>')
    };

    const imageObjMap = {};
    pdfImages.forEach(function (im) {
      const headStr =
        '<< /Type /XObject /Subtype /Image /Width ' + im.spec.width +
        ' /Height ' + im.spec.height +
        ' /ColorSpace ' + im.spec.colorSpace +
        ' /BitsPerComponent 8' +
        ' /Filter ' + im.spec.filter +
        ' /Length ' + im.spec.data.length + ' >>\nstream\n';
      imageObjMap[im.name] = addObj([headStr, im.spec.data, '\nendstream']);
    });

    const xObjectRef = pdfImages.length
      ? (' /XObject << ' + pdfImages.map(function (im) { return '/' + im.name + ' ' + imageObjMap[im.name] + ' 0 R'; }).join(' ') + ' >>')
      : '';
    const resourcesDict = '<< /Font << /F1 ' + fontIds.F1 + ' 0 R /F2 ' + fontIds.F2 + ' 0 R /F3 ' + fontIds.F3 + ' 0 R /F4 ' + fontIds.F4 + ' 0 R /F5 ' + fontIds.F5 + ' 0 R >>' + xObjectRef + ' >>';

    const pageObjIds = pages.map(function (ops) {
      const streamStr = ops.join('\n');
      const streamLen = typeof Buffer !== 'undefined' ? Buffer.byteLength(streamStr, 'latin1') : streamStr.length;
      const contentId = addObj('<< /Length ' + streamLen + ' >>\nstream\n' + streamStr + '\nendstream');
      return addObj('<< /Type /Page /Parent ' + idPages + ' 0 R /MediaBox [0 0 ' + PAGE_W + ' ' + PAGE_H + '] /Resources ' + resourcesDict + ' /Contents ' + contentId + ' 0 R >>');
    });

    objects[idPages - 1] = '<< /Type /Pages /Kids [' + pageObjIds.map(function (id) { return id + ' 0 R'; }).join(' ') + '] /Count ' + pageObjIds.length + ' >>';
    objects[idCatalog - 1] = '<< /Type /Catalog /Pages ' + idPages + ' 0 R >>';

    function strToLatin1Bytes(str) {
      if (typeof Buffer !== 'undefined') return Buffer.from(str, 'latin1');
      const arr = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i) & 0xFF;
      return arr;
    }

    const byteChunks = [];
    let byteCursor = 0;
    function pushChunk(chunk) {
      const bytes = (typeof chunk === 'string') ? strToLatin1Bytes(chunk) : new Uint8Array(chunk);
      byteChunks.push(bytes);
      byteCursor += bytes.length;
    }

    pushChunk('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const offsets = [0];
    objects.forEach(function (obj, idx) {
      offsets.push(byteCursor);
      pushChunk((idx + 1) + ' 0 obj\n');
      if (Array.isArray(obj)) {
        obj.forEach(pushChunk);
      } else {
        pushChunk(String(obj));
      }
      pushChunk('\nendobj\n');
    });

    const xrefOffset = byteCursor;
    let xref = 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n';
    for (let i = 1; i < offsets.length; i++) {
      xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    }
    xref += 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root ' + idCatalog + ' 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF\n';
    pushChunk(xref);

    if (typeof Buffer !== 'undefined') {
      return Buffer.concat(byteChunks.map(function (c) { return Buffer.from(c); }));
    }
    const merged = new Uint8Array(byteCursor);
    let pos = 0;
    byteChunks.forEach(function (c) {
      merged.set(c, pos);
      pos += c.length;
    });
    return merged;
  }

  return {
    VLP_COLOR_THEMES: VLP_COLOR_THEMES,
    MASTER_STYLE_BLOCK: MASTER_STYLE_BLOCK,
    getColorThemes: getColorThemes,
    getColorTheme: getColorTheme,
    getMasterStyleBlock: getMasterStyleBlock,
    inferColorThemeFromHtml: inferColorThemeFromHtml,
    generateUuid: generateUuid,
    escapeHtml: escapeHtml,
    escapeXmlText: escapeXmlText,
    escapeXmlAttr: escapeXmlAttr,
    decodeXmlEntities: decodeXmlEntities,
    stripZeroWidthAndNbsp: stripZeroWidthAndNbsp,
    formatInlineMarkup: formatInlineMarkup,
    extractFilenameFromSrc: extractFilenameFromSrc,
    resolveImageSrc: resolveImageSrc,
    createDefaultCredentialEntry: createDefaultCredentialEntry,
    normalizeCredentialsList: normalizeCredentialsList,
    createDefaultTable: createDefaultTable,
    createDefaultOverviewData: createDefaultOverviewData,
    createDefaultStep: createDefaultStep,
    migrateStepData: migrateStepData,
    createDefaultStepsData: createDefaultStepsData,
    generateCourseOverviewHtml: generateCourseOverviewHtml,
    generateProceduralStepsHtml: generateProceduralStepsHtml,
    generateNodeHtml: generateNodeHtml,
    collectExportNodes: collectExportNodes,
    generateStandaloneManualHtml: generateStandaloneManualHtml,
    generateManualMdx: generateManualMdx,
    generateManualRtf: generateManualRtf,
    generateManualPdfBuffer: generateManualPdfBuffer,
    parseRawTextToSteps: parseRawTextToSteps,
    parseHtmlToNodeState: parseHtmlToNodeState,
    convertLegacyContentToStep: convertLegacyContentToStep,
    convertLegacyNodeToOverview: convertLegacyNodeToOverview,
    consolidateChapterSteps: consolidateChapterSteps,
    parseXmlDocument: parseXmlDocument,
    parseXmlToManual: parseXmlToManual,
    serializeManualToXml: serializeManualToXml,
    getToolbarCatalog: getToolbarCatalog,
    getTemplates: getTemplates
  };
}));
