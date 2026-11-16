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
        contextText: '#991b1b',
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
        contextText: '#1e40af',
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
        contextText: '#065f46',
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
        contextText: '#5b21b6',
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
        contextText: '#92400e',
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
        contextText: '#115e59',
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
        contextText: '#9f1239',
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
        contextText: '#075985',
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
    :root {
      --vlp-accent-red: ${t.dark.accent};
      --vlp-card-bg: ${t.dark.cardBg};
      --vlp-card-border: ${t.dark.cardBorder};
      --vlp-context-bg: ${t.dark.contextBg};
      --vlp-context-text: ${t.dark.contextText};
    }
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
  .lab-wrapper {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: inherit !important;
    line-height: 1.65;
    font-size: 15px;
    max-width: 900px;
    margin: 0 auto;
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
    max-width: 100%;
    height: auto;
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
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid var(--vlp-border) !important;
    border-radius: 8px;
    overflow: hidden;
    margin-top: 14px;
    background: transparent !important;
    background-color: transparent !important;
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
  .step-inline-img {
    max-width: 100%;
    height: auto;
    margin-top: 12px;
    border-radius: 6px;
    border: 1px solid var(--vlp-border);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    display: block;
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
    lines.push('        <th style="width: 8%; text-align: center;">Step</th>');
    lines.push('        <th style="width: 92%;">Action &amp; Verification</th>');
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
  function parseRawTextToSteps(rawText) {
    const cleaned = stripZeroWidthAndNbsp(rawText || '').trim();
    if (!cleaned) return { sectionTitle: '', introText: '', steps: [] };

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
      if (contentLines.length === 0 && !sectionTitle && /^(?:#\s+|Section:\s*|Title:\s*)/i.test(line)) {
        sectionTitle = line.replace(/^(?:#\s+|Section:\s*|Title:\s*)/i, '').trim();
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

    const numberedRe = /^\s*(?:step\s*\d+\s*[:.\-)]|\d+\s*[.)])\s+(.*)$/i;
    const numberedCount = contentLines.filter(function (l) { return numberedRe.test(l); }).length;

    const blocks = [];
    if (numberedCount >= 1) {
      let current = null;
      contentLines.forEach(function (rawLine) {
        const trimmed = rawLine.trim();
        const m = rawLine.match(numberedRe);
        if (m) {
          if (current) blocks.push(current);
          current = [m[1].trim()];
        } else if (current) {
          if (trimmed) current.push(rawLine);
        } else if (trimmed) {
          introParts.push(trimmed);
        }
      });
      if (current) blocks.push(current);
    } else {
      const joined = contentLines.join('\n').trim();
      const hasContextMarker = /(?:^|\n)\s*(?:Context|What you are doing|Why this matters)\s*:/i.test(joined);
      if (hasContextMarker) {
        joined.split(/\r?\n\s*\r?\n/).forEach(function (blk) {
          const lines = blk.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
          if (lines.length) blocks.push(lines);
        });
      } else {
        contentLines.forEach(function (rawLine) {
          const t = rawLine.trim();
          if (!t) return;
          const unbulleted = t.replace(/^(?:[-•]|\*\s)\s+/, '').trim();
          if (unbulleted) blocks.push([unbulleted]);
        });
      }
    }

    const steps = blocks.map(function (blockLines) {
      const step = createDefaultStep();
      const instLines = [];
      const ctxLines = [];
      let inTermFence = false;
      const termLines = [];

      blockLines.forEach(function (line) {
        const t = line.trim();
        if (/^```(?:term|terminal|sh|bash)?\s*$/i.test(t)) {
          inTermFence = !inTermFence;
          return;
        }
        if (inTermFence) {
          termLines.push(line);
          return;
        }
        const ctxMatch = t.match(/^Context:\s*(.*)$/i);
        if (ctxMatch) {
          if (ctxMatch[1].trim()) ctxLines.push(ctxMatch[1].trim());
          return;
        }
        const whatMatch = t.match(/^What you are doing:\s*(.*)$/i);
        if (whatMatch) {
          if (whatMatch[1].trim()) ctxLines.push(whatMatch[1].trim());
          return;
        }
        const whyMatch = t.match(/^Why this matters:\s*(.*)$/i);
        if (whyMatch) {
          if (whyMatch[1].trim()) ctxLines.push(whyMatch[1].trim());
          return;
        }
        const termMatch = t.match(/^(?:Terminal|Output):\s*(.*)$/i);
        if (termMatch) {
          if (termMatch[1].trim()) termLines.push(termMatch[1].trim());
          return;
        }
        instLines.push(t);
      });

      step.instruction = instLines.join('\n');
      step.contextText = ctxLines.join('\n');
      if (termLines.length > 0) {
        const first = termLines[0].trim();
        const promptMatch = first.match(/^(\[[^\]]+\][$#]|[^\s]+@[^\s]+:[^$#]*[$#]|[A-Z]:\\[^>]*>|PS\s+[^>]+>)\s*(.*)$/);
        if (promptMatch) {
          step.termPrompt = promptMatch[1].trim();
          step.termCommand = promptMatch[2].trim();
          step.termOutput = termLines.slice(1).join('\n');
        } else {
          step.termOutput = termLines.join('\n');
        }
      }
      return step;
    });

    return {
      sectionTitle: sectionTitle,
      introText: introParts.join('\n\n'),
      steps: steps
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
