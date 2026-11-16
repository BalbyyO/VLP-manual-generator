(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VLPFormatter = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MASTER_STYLE_BLOCK = `<style>
  :root {
    --vlp-border: rgba(128, 128, 128, 0.3);
    --vlp-accent-red: #dc2626;
    --vlp-card-bg: rgba(220, 38, 38, 0.08);
    --vlp-card-border: rgba(239, 68, 68, 0.4);
    --vlp-th-bg: rgba(128, 128, 128, 0.15);
    --vlp-row-even: rgba(128, 128, 128, 0.06);
    --vlp-kbd-bg: rgba(128, 128, 128, 0.15);
    --vlp-kbd-border: rgba(128, 128, 128, 0.35);
    --vlp-context-bg: rgba(128, 128, 128, 0.08);
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --vlp-accent-red: #ef4444;
      --vlp-card-bg: rgba(239, 68, 68, 0.14);
      --vlp-card-border: rgba(239, 68, 68, 0.45);
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
    --vlp-accent-red: #ef4444;
    --vlp-card-bg: rgba(239, 68, 68, 0.14);
    --vlp-card-border: rgba(239, 68, 68, 0.45);
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

  /* Red Box Callouts: Only for Instructional Purpose and Initial/Switched Target VM Credentials */
  .purpose-card,
  .lab-note {
    background-color: var(--vlp-card-bg) !important;
    border: 1px solid var(--vlp-card-border) !important;
    border-left: 5px solid var(--vlp-accent-red) !important;
    border-radius: 6px;
    padding: 1.25rem 1.5rem;
    margin: 1.5rem 0;
    color: inherit !important;
  }

  .purpose-card h2,
  .lab-note h2,
  .lab-note > strong {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--vlp-accent-red) !important;
    margin: 0 0 0.75rem 0;
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

  /* Responsive Step Table with Dark Mode Transparency Overrides */
  .lab-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid var(--vlp-border) !important;
    border-radius: 8px;
    overflow: hidden;
    margin-top: 16px;
    background: transparent !important;
    background-color: transparent !important;
  }

  .lab-table thead,
  .lab-table tbody,
  .lab-table tr,
  .lab-table td {
    background: transparent !important;
    background-color: transparent !important;
    color: inherit !important;
  }

  .lab-table tbody tr:nth-child(even),
  .lab-table tbody tr:nth-child(even) td {
    background-color: var(--vlp-row-even) !important;
  }

  .lab-table th {
    background-color: var(--vlp-th-bg) !important;
    color: inherit !important;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    padding: 10px 14px;
    text-align: left;
    border-bottom: 1px solid var(--vlp-border) !important;
  }

  .lab-table td {
    padding: 12px 14px;
    border-top: 1px solid var(--vlp-border) !important;
    vertical-align: top;
  }

  .lab-table tbody tr:first-child td {
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
    background-color: #0f172a !important;
    color: #38bdf8 !important;
    border: 1px solid #334155 !important;
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

  .term-box {
    background-color: #0f172a !important;
    color: #e2e8f0 !important;
    border: 1px solid #1e293b !important;
    border-radius: 6px;
    font-family: ui-monospace, Menlo, Monaco, Consolas, monospace !important;
    font-size: 0.85rem;
    padding: 10px 14px;
    margin-top: 8px;
    line-height: 1.5;
  }

  .term-prompt {
    color: #4ade80 !important;
    font-weight: 600;
  }

  .step-context {
    background-color: var(--vlp-context-bg) !important;
    border-left: 3px solid var(--vlp-border) !important;
    padding: 10px 12px;
    margin-top: 10px;
    font-size: 0.9rem;
    border-radius: 0 4px 4px 0;
    color: inherit !important;
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

    // Iteratively stash innermost allowed inline tags first so nested safe tags work cleanly
    text = text.replace(/<br\s*\/?>/gi, function () {
      return stash('<br />');
    });

    text = text.replace(
      /<span\s+class=["']ui-target["'][^>]*>([\s\S]*?)<\/span>/gi,
      function (_, inner) {
        return stash('<span class="ui-target">' + escapeHtmlPreserveEntities(stripZeroWidthAndNbsp(inner)) + '</span>');
      }
    );

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

    text = text.replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, function (_, _tag, inner) {
      // Allow nested stashed tokens inside <strong>
      return stash('<strong>' + escapeHtmlPreserveEntities(stripZeroWidthAndNbsp(inner)) + '</strong>');
    });

    text = text.replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, function (_, _tag, inner) {
      return stash('<em>' + escapeHtmlPreserveEntities(stripZeroWidthAndNbsp(inner)) + '</em>');
    });

    text = text.replace(/<u>([\s\S]*?)<\/u>/gi, function (_, inner) {
      return stash('<u>' + escapeHtmlPreserveEntities(stripZeroWidthAndNbsp(inner)) + '</u>');
    });

    // Escape any remaining un-stashed raw text (<, >, &)
    text = escapeHtmlPreserveEntities(text);

    // Apply explicit markup shortcuts ONLY
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

    // Restore stashed tags (in reverse/iterative pass in case of nested tags)
    let pass = 0;
    while (text.indexOf('\uE000VLPTOK_') !== -1 && pass < 5) {
      text = text.replace(/\uE000VLPTOK_(\d+)\uE001/g, function (_, idx) {
        return tokens[Number(idx)] || '';
      });
      pass++;
    }

    // Preserve explicit line breaks inside a paragraph/step
    text = text.replace(/\r?\n/g, '<br />\n          ');
    return text;
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
    // mode === 'vlp'
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

  function createDefaultOverviewData() {
    return {
      courseTitle: '',
      bannerSrc: '',
      bannerAlt: 'Course Banner',
      overviewText: '',
      showDivider: true,
      purposeEnabled: false,
      purposeTitle: 'INSTRUCTIONAL PURPOSE',
      purposeText: '',
      credentialsEnabled: false,
      credentialsTitle: 'Target VM Credentials',
      credentialsTarget: '',
      credentialsUsername: '',
      credentialsPassword: ''
    };
  }

  function createDefaultStep() {
    return {
      id: generateUuid(),
      instruction: '',
      whatDoing: '',
      whyMatters: '',
      termPrompt: '',
      termCommand: '',
      termOutput: '',
      images: []
    };
  }

  function createDefaultStepsData() {
    return {
      sectionTitle: '',
      introText: '',
      steps: [createDefaultStep()]
    };
  }

  function generateCourseOverviewHtml(data, options) {
    const d = Object.assign(createDefaultOverviewData(), data || {});
    const lines = [];
    lines.push(MASTER_STYLE_BLOCK);
    lines.push('<div class="course-overview">');

    if (d.courseTitle && d.courseTitle.trim()) {
      lines.push('  <div class="course-header">');
      lines.push('    <h1>' + escapeHtmlPreserveEntities(stripZeroWidthAndNbsp(d.courseTitle.trim())) + '</h1>');
      lines.push('  </div>');
    }

    if (d.bannerSrc && d.bannerSrc.trim()) {
      const resolvedBanner = resolveImageSrc(d.bannerSrc.trim(), options);
      const altText = escapeHtml(d.bannerAlt && d.bannerAlt.trim() ? d.bannerAlt.trim() : 'Course Banner');
      lines.push('');
      lines.push('  <div class="banner-container">');
      lines.push('    <img class="banner-img" src="' + escapeHtml(resolvedBanner) + '" alt="' + altText + '" />');
      lines.push('  </div>');
    }

    const paragraphs = splitParagraphs(d.overviewText);
    if (paragraphs.length > 0) {
      lines.push('');
      paragraphs.forEach(function (para) {
        lines.push('  <p>' + formatInlineMarkup(para) + '</p>');
      });
    }

    const hasRedCard = Boolean(d.purposeEnabled || d.credentialsEnabled);
    if (d.showDivider && (paragraphs.length > 0 || d.bannerSrc || d.courseTitle) && hasRedCard) {
      lines.push('');
      lines.push('  <hr class="section-divider" />');
    }

    if (d.purposeEnabled) {
      const pTitle = (d.purposeTitle && d.purposeTitle.trim()) ? d.purposeTitle.trim() : 'INSTRUCTIONAL PURPOSE';
      const pParas = splitParagraphs(d.purposeText);
      lines.push('');
      lines.push('  <div class="purpose-card">');
      lines.push('    <h2>' + escapeHtmlPreserveEntities(pTitle) + '</h2>');
      if (pParas.length === 0) {
        lines.push('    <p>Purpose details for the course annex.</p>');
      } else {
        pParas.forEach(function (p) {
          lines.push('    <p>' + formatInlineMarkup(p) + '</p>');
        });
      }
      lines.push('  </div>');
    }

    if (d.credentialsEnabled) {
      const cTitle = (d.credentialsTitle && d.credentialsTitle.trim()) ? d.credentialsTitle.trim() : 'Target VM Credentials';
      lines.push('');
      lines.push('  <div class="lab-note">');
      lines.push('    <h2>' + escapeHtmlPreserveEntities(cTitle) + '</h2>');
      lines.push('    <ul>');
      if (d.credentialsTarget && d.credentialsTarget.trim()) {
        lines.push('      <li><strong>Target System:</strong> <span class="ui-target">' + escapeHtmlPreserveEntities(d.credentialsTarget.trim()) + '</span></li>');
      }
      if (d.credentialsUsername && d.credentialsUsername.trim()) {
        lines.push('      <li><strong>Username:</strong> <code class="cmd-inline">' + escapeHtmlPreserveEntities(d.credentialsUsername.trim()) + '</code></li>');
      }
      if (d.credentialsPassword && d.credentialsPassword.trim()) {
        lines.push('      <li><strong>Password:</strong> <code class="cmd-inline">' + escapeHtmlPreserveEntities(d.credentialsPassword.trim()) + '</code></li>');
      }
      if (!d.credentialsTarget && !d.credentialsUsername && !d.credentialsPassword) {
        lines.push('      <li><strong>Target System:</strong> <span class="ui-target">VM-NAME</span></li>');
      }
      lines.push('    </ul>');
      lines.push('  </div>');
    }

    lines.push('</div>');
    return lines.join('\n');
  }

  function generateProceduralStepsHtml(data, options) {
    const d = Object.assign(createDefaultStepsData(), data || {});
    const steps = Array.isArray(d.steps) ? d.steps : [];
    const lines = [];
    lines.push(MASTER_STYLE_BLOCK);
    lines.push('<div class="lab-wrapper">');

    if (d.sectionTitle && d.sectionTitle.trim()) {
      lines.push('  <div class="lab-header">');
      lines.push('    <h3>' + escapeHtmlPreserveEntities(stripZeroWidthAndNbsp(d.sectionTitle.trim())) + '</h3>');
      lines.push('  </div>');
    }

    const intros = splitParagraphs(d.introText);
    if (intros.length > 0) {
      lines.push('');
      intros.forEach(function (para) {
        lines.push('  <p>' + formatInlineMarkup(para) + '</p>');
      });
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

      const hasWhat = Boolean(step.whatDoing && step.whatDoing.trim());
      const hasWhy = Boolean(step.whyMatters && step.whyMatters.trim());
      if (hasWhat || hasWhy) {
        lines.push('          <div class="step-context">');
        if (hasWhat && hasWhy) {
          lines.push('            <strong>What you are doing:</strong> ' + formatInlineMarkup(step.whatDoing) + '<br />');
          lines.push('            <strong>Why this matters:</strong> ' + formatInlineMarkup(step.whyMatters));
        } else if (hasWhat) {
          lines.push('            <strong>What you are doing:</strong> ' + formatInlineMarkup(step.whatDoing));
        } else {
          lines.push('            <strong>Why this matters:</strong> ' + formatInlineMarkup(step.whyMatters));
        }
        lines.push('          </div>');
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
        const resolved = resolveImageSrc(img.src.trim(), options);
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
    // Raw HTML mode: resolve image preview/base64 paths if requested, otherwise return rawHtml intact
    let html = String(node.rawHtml || '');
    if (options && (options.imageMode === 'preview' || options.imageMode === 'base64')) {
      html = html.replace(/(<img\b[^>]*\bsrc=)(["'])([^"']+)\2/gi, function (_, prefix, quote, src) {
        return prefix + quote + escapeHtml(resolveImageSrc(src, options)) + quote;
      });
    }
    return html;
  }

  /**
   * Parses raw pasted text deterministically into procedural steps (strict step fidelity).
   * Supports:
   * - Numbered steps (`1. ...`, `Step 1: ...`, `1) ...`)
   * - Blank-line-separated blocks containing `What you are doing:` / `Why this matters:`
   * - Single-line-per-step lists
   * - Optional `Section:` / `# ` header and `Intro:` prefix
   */
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
      const hasContextMarker = /(?:what you are doing|why this matters)\s*:/i.test(joined);
      if (hasContextMarker) {
        joined.split(/\r?\n\s*\r?\n/).forEach(function (blk) {
          const lines = blk.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
          if (lines.length) blocks.push(lines);
        });
      } else {
        contentLines.forEach(function (rawLine) {
          const t = rawLine.trim();
          if (!t) return;
          // Strip only single bullet prefixes like "- " or "• ", NOT "**bold**"
          const unbulleted = t.replace(/^(?:[-•]|\*\s)\s+/, '').trim();
          if (unbulleted) blocks.push([unbulleted]);
        });
      }
    }

    const steps = blocks.map(function (blockLines) {
      const step = createDefaultStep();
      const instLines = [];
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
        const whatMatch = t.match(/^What you are doing:\s*(.*)$/i);
        if (whatMatch) {
          step.whatDoing = whatMatch[1].trim();
          return;
        }
        const whyMatch = t.match(/^Why this matters:\s*(.*)$/i);
        if (whyMatch) {
          step.whyMatters = whyMatch[1].trim();
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

  /**
   * Cleans legacy Word / CKEditor HTML and extracts structured text fragments & images.
   */
  function stripLegacyWrappers(html) {
    let s = stripZeroWidthAndNbsp(String(html || ''));
    // Remove HTML comments
    s = s.replace(/<!--[\s\S]*?-->/g, '');
    // Unwrap <span style="...">...</span> (Calibri / Times New Roman / color:black clutter)
    let prev;
    do {
      prev = s;
      s = s.replace(/<span(?:\s+style=["'][^"']*["'])?\s*>([\s\S]*?)<\/span>/gi, '$1');
    } while (s !== prev);
    // Clean empty tags and extra nbsp
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
    // Remove img tags
    s = s.replace(/<img\b[^>]*>/gi, '');
    // Convert <br> to newline
    s = s.replace(/<br\s*\/?>/gi, '\n');
    // Convert bare <code> to <code class="cmd-inline">
    s = s.replace(/<code>([\s\S]*?)<\/code>/gi, '<code class="cmd-inline">$1</code>');
    // Keep only supported inline tags (strong, em, u, span.ui-target, code.cmd-inline, kbd.key-press)
    const tokens = [];
    s = s.replace(/<(\/?)(strong|em|u)\b[^>]*>/gi, function (_, slash, tag) {
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
    // Strip any remaining unknown tags
    s = s.replace(/<[^>]+>/g, '');
    s = decodeXmlEntities(s);
    // Restore inline tags
    let pass = 0;
    while (s.indexOf('\uE002TAG_') !== -1 && pass < 5) {
      s = s.replace(/\uE002TAG_(\d+)\uE003/g, function (_, idx) {
        return tokens[Number(idx)] || '';
      });
      pass++;
    }
    // Clean redundant nested <strong><strong>...</strong></strong>
    s = s.replace(/<strong>\s*<strong>([\s\S]*?)<\/strong>\s*<\/strong>/gi, '<strong>$1</strong>');
    s = s.replace(/<strong>\s*<\/strong>/gi, '');
    s = s.replace(/<em>\s*<\/em>/gi, '');
    s = s.replace(/[ \t]{2,}/g, ' ');
    return s.split('\n').map(function (l) { return l.trim(); }).filter(Boolean).join('\n').trim();
  }

  function extractLegacyBlockElements(html) {
    const cleaned = stripLegacyWrappers(html);
    const blocks = [];
    // Extract top-level blocks: p, ul, ol, table, h1..h6, div
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
        if (rows.length) blocks.push({ type: 'table', rows: rows });
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

  /**
   * Parses an already-formatted or legacy HTML string into a structured node state.
   */
  function parseHtmlToNodeState(rawHtml, nodeTitle, nodeImages) {
    const html = String(rawHtml || '').trim();
    const attachedImages = Array.isArray(nodeImages) ? nodeImages : [];

    // 1. Detect Course Overview format (.course-overview without non-standard elements)
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

      const purposeMatch = html.match(/<div\s+class=["']purpose-card["'][^>]*>([\s\S]*?)<\/div>/i);
      if (purposeMatch) {
        data.purposeEnabled = true;
        const pH2 = purposeMatch[1].match(/<h2>([\s\S]*?)<\/h2>/i);
        if (pH2) data.purposeTitle = stripTagsToCleanInline(pH2[1]);
        const pList = [];
        const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        let pm;
        while ((pm = pRe.exec(purposeMatch[1])) !== null) {
          const t = stripTagsToCleanInline(pm[1]);
          if (t) pList.push(t);
        }
        data.purposeText = pList.join('\n\n');
      }

      const credMatch = html.match(/<div\s+class=["']lab-note["'][^>]*>([\s\S]*?)<\/div>/i);
      if (credMatch) {
        data.credentialsEnabled = true;
        const cH2 = credMatch[1].match(/<h2>([\s\S]*?)<\/h2>/i);
        if (cH2) data.credentialsTitle = stripTagsToCleanInline(cH2[1]);
        const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
        let lm;
        while ((lm = liRe.exec(credMatch[1])) !== null) {
          const itemHtml = lm[1];
          const plain = stripTagsToCleanInline(itemHtml).replace(/<[^>]+>/g, '');
          if (/Target\s*System\s*:/i.test(plain)) {
            data.credentialsTarget = plain.replace(/^.*Target\s*System\s*:\s*/i, '').trim();
          } else if (/Username\s*:/i.test(plain)) {
            data.credentialsUsername = plain.replace(/^.*Username\s*:\s*/i, '').trim();
          } else if (/Password\s*:/i.test(plain)) {
            data.credentialsPassword = plain.replace(/^.*Password\s*:\s*/i, '').trim();
          }
        }
      }

      // Extract overview paragraphs outside header/banner/purpose-card/lab-note
      let bodyOnly = html
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<div\s+class=["']course-header["'][^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div\s+class=["']banner-container["'][^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div\s+class=["']purpose-card["'][^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div\s+class=["']lab-note["'][^>]*>[\s\S]*?<\/div>/gi, '');
      const ovParas = [];
      const opRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
      let opm;
      while ((opm = opRe.exec(bodyOnly)) !== null) {
        const t = stripTagsToCleanInline(opm[1]);
        if (t) ovParas.push(t);
      }
      data.overviewText = ovParas.join('\n\n');

      return { mode: 'overview', overview: data, stepsData: createDefaultStepsData(), rawHtml: html };
    }

    // 2. Detect standard Procedural Steps format (.lab-wrapper without non-spec custom cards like .ref-gallery / .verify-card)
    const hasCustomNonSpec = /<(?:div)\s+class=["'](?:ref-gallery|verify-card|remed-card)["']/i.test(html);
    if (/<div\s+class=["']lab-wrapper["'][^>]*>/i.test(html) && /<table\s+class=["']lab-table["']/i.test(html) && !hasCustomNonSpec) {
      const data = createDefaultStepsData();
      const h3Match = html.match(/<div\s+class=["']lab-header["'][^>]*>[\s\S]*?<h3>([\s\S]*?)<\/h3>[\s\S]*?<\/div>/i);
      if (h3Match) data.sectionTitle = stripTagsToCleanInline(h3Match[1]);

      const beforeTable = html.split(/<table\s+class=["']lab-table["']/i)[0] || '';
      const introParas = [];
      const ipRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
      let ipm;
      while ((ipm = ipRe.exec(beforeTable)) !== null) {
        const t = stripTagsToCleanInline(ipm[1]);
        if (t) introParas.push(t);
      }
      data.introText = introParas.join('\n\n');

      const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/i);
      const steps = [];
      if (tbodyMatch) {
        const trRe = /<tr>([\s\S]*?)<\/tr>/gi;
        let trm;
        while ((trm = trRe.exec(tbodyMatch[1])) !== null) {
          const tdMatches = [];
          const tdRe = /<td\b[^>]*>([\s\S]*?)<\/td>/gi;
          let tdm;
          while ((tdm = tdRe.exec(trm[1])) !== null) {
            tdMatches.push(tdm[1]);
          }
          if (tdMatches.length === 0) continue;
          const cellHtml = tdMatches.length >= 2 ? tdMatches[1] : tdMatches[0];
          const step = createDefaultStep();

          // Context block
          const ctxMatch = cellHtml.match(/<div\s+class=["']step-context["'][^>]*>([\s\S]*?)<\/div>/i);
          if (ctxMatch) {
            const ctxClean = stripTagsToCleanInline(ctxMatch[1]);
            ctxClean.split('\n').forEach(function (line) {
              const plain = line.replace(/<\/?strong>/gi, '');
              if (/^What you are doing:/i.test(plain)) {
                step.whatDoing = line.replace(/^<strong>\s*What you are doing:\s*<\/strong>\s*/i, '').replace(/^What you are doing:\s*/i, '').trim();
              } else if (/^Why this matters:/i.test(plain)) {
                step.whyMatters = line.replace(/^<strong>\s*Why this matters:\s*<\/strong>\s*/i, '').replace(/^Why this matters:\s*/i, '').trim();
              }
            });
          }

          // Terminal box
          const termMatch = cellHtml.match(/<div\s+class=["']term-box["'][^>]*>([\s\S]*?)<\/div>/i);
          if (termMatch) {
            let termHtml = termMatch[1];
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
              step.termOutput = termLines.slice(1).filter(function (l, i, arr) {
                return i < arr.length - 1 || l !== '';
              }).join('\n').trim();
            } else {
              step.termOutput = termLines.filter(Boolean).join('\n');
            }
          }

          // Images
          step.images = extractImagesFromHtml(cellHtml);

          // Instruction (remove context, term-box, images)
          const instHtml = cellHtml
            .replace(/<div\s+class=["']step-context["'][^>]*>[\s\S]*?<\/div>/gi, '')
            .replace(/<div\s+class=["']term-box["'][^>]*>[\s\S]*?<\/div>/gi, '')
            .replace(/<img\b[^>]*>/gi, '');
          step.instruction = stripTagsToCleanInline(instHtml);
          steps.push(step);
        }
      }
      data.steps = steps.length ? steps : [createDefaultStep()];
      return { mode: 'steps', overview: createDefaultOverviewData(), stepsData: data, rawHtml: html };
    }

    // 3. Otherwise preserve in raw mode (legacy or empty)
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
   * Converts a single legacy HTML node cleanly into either an Overview or Procedural Step structure.
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
    blocks.forEach(function (blk) {
      if (blk.type === 'p' || blk.type === 'div' || /^h[1-6]$/.test(blk.type)) {
        const plain = blk.text.replace(/<\/?strong>/gi, '').trim();
        const whatM = plain.match(/^What you are doing:\s*([\s\S]*)$/i);
        const whyM = plain.match(/^Why this matters:\s*([\s\S]*)$/i);
        if (whatM) {
          step.whatDoing = blk.text.replace(/^<strong>\s*What you are doing:\s*<\/strong>\s*/i, '').replace(/^What you are doing:\s*/i, '').trim();
        } else if (whyM) {
          step.whyMatters = blk.text.replace(/^<strong>\s*Why this matters:\s*<\/strong>\s*/i, '').replace(/^Why this matters:\s*/i, '').trim();
        } else if (blk.text.trim()) {
          instParts.push(blk.text.trim());
        }
      } else if (blk.type === 'ul' || blk.type === 'ol') {
        blk.items.forEach(function (it, i) {
          instParts.push((blk.type === 'ol' ? (i + 1) + '. ' : '• ') + it);
        });
      } else if (blk.type === 'table') {
        blk.rows.forEach(function (r) {
          instParts.push(r.filter(Boolean).join(': '));
        });
      }
    });

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
        blk.items.forEach(function (it) { paras.push('• ' + it); });
      } else if (blk.type === 'table') {
        blk.rows.forEach(function (r) { paras.push(r.filter(Boolean).join(' — ')); });
      } else if (blk.text) {
        paras.push(blk.text);
      }
    });
    data.overviewText = paras.join('\n\n');
    data.showDivider = false;
    return data;
  }

  /**
   * Consolidates a Chapter node's legacy child step nodes into a single VLP .lab-wrapper step table node.
   * Formats the chapter node itself as a .course-overview if currently in raw/legacy mode.
   */
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
          consolidatedSteps.push(JSON.parse(JSON.stringify(st)));
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
      stepsData: {
        sectionTitle: stripZeroWidthAndNbsp(cloned.title || 'Lab Procedure').trim(),
        introText: '',
        steps: consolidatedSteps.length ? consolidatedSteps : [createDefaultStep()]
      },
      rawHtml: '',
      images: mergedChildImages,
      children: []
    };

    // Keep any already-formatted steps nodes only if we converted legacy siblings; otherwise replace with single consolidated node
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

      pos++; // skip '<'
      const nameStart = pos;
      while (pos < len && !/[\s/>]/.test(src[pos])) pos++;
      const tagName = src.slice(nameStart, pos);

      // Scan up to '>' respecting quotes
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

    return {
      id: root.attrs.id || generateUuid(),
      name: (nameEl ? nameEl.text : 'vlp.manual') || 'vlp.manual',
      defaultLanguageCode: (langEl ? langEl.text : 'en') || 'en',
      dataFormat: (fmtEl ? fmtEl.text : 'default') || 'default',
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

  function serializeContentNodeToXml(node, orderIndex, indent, defaultLang, imageMetaLookup) {
    const lines = [];
    const pad = ' '.repeat(indent);
    const id = node.id || generateUuid();
    const title = node.title || 'Untitled';
    const lang = node.languageCode || defaultLang || 'en';
    const html = generateNodeHtml(node, { imageMode: 'vlp' });
    const xmlImages = collectNodeImagesForXml(node, html, imageMetaLookup);

    lines.push(pad + "<ContentNode id='" + escapeXmlAttr(id) + "'>");
    lines.push(pad + '  <title>' + escapeXmlText(title) + '</title>');
    lines.push(pad + '  <orderIndex>' + String(orderIndex) + '</orderIndex>');

    if (Array.isArray(node.children) && node.children.length > 0) {
      lines.push(pad + '  <children>');
      node.children.forEach(function (child, idx) {
        lines.push(serializeContentNodeToXml(child, idx, indent + 4, lang, imageMetaLookup));
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
    const lines = [];
    lines.push("<Manual id='" + escapeXmlAttr(m.id || generateUuid()) + "'>");
    lines.push('  <name>' + escapeXmlText(m.name || 'vlp.manual') + '</name>');
    lines.push('  <defaultLanguageCode>' + escapeXmlText(lang) + '</defaultLanguageCode>');
    lines.push('  <dataFormat>' + escapeXmlText(m.dataFormat || 'default') + '</dataFormat>');
    lines.push('  <contentNodes>');
    (m.contentNodes || []).forEach(function (node, idx) {
      lines.push(serializeContentNodeToXml(node, idx, 4, lang, imageMetaLookup));
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
        summary: 'Highlights buttons, icons, menus, window names, and VM names in bold high-contrast red.',
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
        summary: 'Renders CLI commands, tools, usernames, and passwords in a dark slate pill with cyan monospace text.',
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
        id: 'course-header',
        category: 'overview',
        label: 'Course Header (H1)',
        shortcut: 'Course Overview field',
        tagPreview: '<div class="course-header"><h1>...</h1></div>',
        summary: 'Centered bold red H1 banner heading at the top of a Course Overview or Introduction page.',
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
        summary: 'Subtle horizontal rule separating narrative overview text from red callout cards.',
        whenToUse: 'Place between introductory paragraphs and the Instructional Purpose or Credentials card.',
        demoHtml: '<hr class="section-divider" style="margin:0.75rem 0;" />'
      },
      {
        id: 'purpose-card',
        category: 'overview',
        label: 'Instructional Purpose Card',
        shortcut: 'Red Box Rule #1',
        tagPreview: '<div class="purpose-card"><h2>INSTRUCTIONAL PURPOSE</h2>...</div>',
        summary: 'Adaptive translucent red callout box reserved strictly for Instructional Purpose at the start of a manual.',
        whenToUse: 'Only at the beginning of a manual to explain course objectives and training audience.',
        demoHtml: '<div class="purpose-card" style="margin:0.25rem 0;"><h2>INSTRUCTIONAL PURPOSE</h2><p>Explains why this annex exists and what students will master.</p></div>'
      },
      {
        id: 'lab-note',
        category: 'overview',
        label: 'Target VM Credentials Card',
        shortcut: 'Red Box Rule #2',
        tagPreview: '<div class="lab-note"><h2>Target VM Credentials</h2><ul>...</ul></div>',
        summary: 'Adaptive translucent red callout box reserved strictly for introducing a VM or switching target VMs.',
        whenToUse: 'Only when first introducing a VM or switching to a new target VM. Omit on subsequent pages on the same VM.',
        demoHtml: '<div class="lab-note" style="margin:0.25rem 0;"><h2>Target VM Credentials</h2><ul><li><strong>Target System:</strong> <span class="ui-target">NDSACDC01</span></li><li><strong>Username:</strong> <code class="cmd-inline">xadministrator</code></li><li><strong>Password:</strong> <code class="cmd-inline">M@rines1M@rines1</code></li></ul></div>'
      },
      {
        id: 'lab-header',
        category: 'steps',
        label: 'Lab Section Header (H3)',
        shortcut: 'Section Title field',
        tagPreview: '<div class="lab-header"><h3>...</h3></div>',
        summary: 'Red left-bordered H3 header introducing a procedural task page.',
        whenToUse: 'Top of every procedural step page inside .lab-wrapper.',
        demoHtml: '<div class="lab-header" style="margin-bottom:0.25rem;"><h3>Access Server Manager and Configure Time</h3></div>'
      },
      {
        id: 'lab-table',
        category: 'steps',
        label: 'Procedural Step Row',
        shortcut: '+ Add Step button',
        tagPreview: '<table class="lab-table">...<span class="step-badge">1</span>...</table>',
        summary: 'Responsive alternating-row table with circular red step number badges and Action & Verification column.',
        whenToUse: 'Use for all numbered student procedures to preserve strict step fidelity and dark-mode contrast.',
        demoHtml: '<table class="lab-table" style="margin-top:0;"><thead><tr><th style="width:12%;text-align:center;">Step</th><th style="width:88%;">Action &amp; Verification</th></tr></thead><tbody><tr><td style="text-align:center;"><span class="step-badge">1</span></td><td>Open <span class="ui-target">Server Manager</span> and run <code class="cmd-inline">whoami</code>.</td></tr></tbody></table>'
      },
      {
        id: 'step-context',
        category: 'steps',
        label: 'Step Context Block',
        shortcut: 'What / Why fields',
        tagPreview: '<div class="step-context"><strong>What you are doing:</strong> ...</div>',
        summary: 'Left-bordered muted context block nested beneath a step instruction for pedagogical explanations.',
        whenToUse: 'Use when a step includes "What you are doing" and/or "Why this matters" details.',
        demoHtml: '<div class="step-context" style="margin-top:0;"><strong>What you are doing:</strong> Opening Local Group Policy Editor.<br /><strong>Why this matters:</strong> Group Policy manages server security baselines.</div>'
      },
      {
        id: 'term-box',
        category: 'steps',
        label: 'Terminal Output Box',
        shortcut: 'Terminal Verification fields',
        tagPreview: '<div class="term-box"><span class="term-prompt">...</span> ...</div>',
        summary: 'High-contrast dark terminal panel with bright green shell prompt for expected CLI verification output.',
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
        description: 'Front-page introduction with Course Header, Banner Image, overview text, Section Divider, and Instructional Purpose red box.',
        nodeTitle: 'Course Overview',
        mode: 'overview',
        overview: {
          courseTitle: 'WINDOWS SERVER 2022',
          bannerSrc: './images/banner-sample.svg',
          bannerAlt: 'Windows Server Administration Overview',
          overviewText:
            'Windows Server is the backbone operating system used across enterprise networks to manage identity, DNS, and core infrastructure services. In this lab, you will navigate <span class="ui-target">Server Manager</span>, configure system time, and verify baseline tools using <code class="cmd-inline">gpedit.msc</code> and <code class="cmd-inline">whoami</code>.',
          showDivider: true,
          purposeEnabled: true,
          purposeTitle: 'INSTRUCTIONAL PURPOSE',
          purposeText:
            'This annex is developed for hands-on instructional use.\n\nIt provides a structured, step-by-step workflow for configuring baseline server settings, navigating <span class="ui-target">Server Manager</span>, and verifying administrative privileges.',
          credentialsEnabled: false,
          credentialsTitle: 'Target VM Credentials',
          credentialsTarget: '',
          credentialsUsername: '',
          credentialsPassword: ''
        },
        stepsData: createDefaultStepsData()
      },
      {
        id: 'vm-credentials',
        name: 'Target VM Transition & Credentials',
        badge: 'Red Box #2',
        description: 'Standalone announcement switching to a target VM with the Target VM Credentials red callout box.',
        nodeTitle: 'Target VM Login',
        mode: 'overview',
        overview: {
          courseTitle: '',
          bannerSrc: '',
          bannerAlt: '',
          overviewText:
            'All the following steps will be conducted on the virtual machine labeled <span class="ui-target">NDSACDC01</span> in your console menu. Log in using the administrative account below before proceeding to the first procedural step.',
          showDivider: false,
          purposeEnabled: false,
          purposeTitle: 'INSTRUCTIONAL PURPOSE',
          purposeText: '',
          credentialsEnabled: true,
          credentialsTitle: 'Target VM Credentials',
          credentialsTarget: 'NDSACDC01',
          credentialsUsername: 'xadministrator',
          credentialsPassword: 'M@rines1M@rines1'
        },
        stepsData: createDefaultStepsData()
      },
      {
        id: 'procedural-steps',
        name: 'Procedural Steps Table',
        badge: 'Layout 2',
        description: 'Standard .lab-wrapper exercise demonstrating Step Badges, UI Targets, Commands, Key Presses, Step Context, Terminal Output, and Inline Images.',
        nodeTitle: 'Step 1',
        mode: 'steps',
        overview: createDefaultOverviewData(),
        stepsData: {
          sectionTitle: 'Access Local Group Policy and Verify Administrative Context',
          introText:
            'In this exercise, you will launch the <span class="ui-target">Local Group Policy Editor</span> and verify your current administrative shell identity before applying system policies.',
          steps: [
            {
              id: 'tpl-step-1',
              instruction: 'Press <kbd class="key-press">Windows Key + R</kbd>, type <code class="cmd-inline">gpedit.msc</code>, and press <kbd class="key-press">Enter</kbd>.',
              whatDoing: 'You are opening the <span class="ui-target">Local Group Policy Editor</span> management console.',
              whyMatters: 'Group Policy controls security baselines and firewall rules on Windows Server.',
              termPrompt: '',
              termCommand: '',
              termOutput: '',
              images: [{ src: './images/step-sample.svg', alt: 'Opening Local Group Policy Editor' }]
            },
            {
              id: 'tpl-step-2',
              instruction: 'Open <span class="ui-target">Windows PowerShell</span> and verify the active account by typing <code class="cmd-inline">whoami</code> and pressing <kbd class="key-press">Enter</kbd>.',
              whatDoing: '',
              whyMatters: '',
              termPrompt: '[admin@host ~]$',
              termCommand: 'whoami',
              termOutput: 'admin',
              images: []
            },
            {
              id: 'tpl-step-3',
              instruction: '<span class="ui-target">Verification:</span> Confirm the <span class="ui-target">Local Computer Policy</span> tree appears in the left navigation pane.',
              whatDoing: '',
              whyMatters: '',
              termPrompt: '',
              termCommand: '',
              termOutput: '',
              images: []
            }
          ]
        }
      },
      {
        id: 'all-buttons-showcase',
        name: 'All-Buttons Interactive Showcase',
        badge: 'Demo',
        description: 'Demonstrates every inline tag and procedural block button in a single ready-to-preview template.',
        nodeTitle: 'All-Buttons Showcase',
        mode: 'steps',
        overview: createDefaultOverviewData(),
        stepsData: {
          sectionTitle: 'VLP Formatter All-Buttons Demonstration',
          introText:
            'This showcase demonstrates every semantic element supported by the VLP formatter: <span class="ui-target">UI Target</span>, <code class="cmd-inline">Command / Credential</code>, <kbd class="key-press">Key Press</kbd>, Step Context, Terminal Output Box, and Inline Screenshot.',
          steps: [
            {
              id: 'demo-step-1',
              instruction: 'UI Target & Key Press Demo: Click <span class="ui-target">Start</span>, select <span class="ui-target">Run</span>, or press <kbd class="key-press">Windows Key + R</kbd>.',
              whatDoing: 'Testing the <span class="ui-target">UI Target</span> red highlight and <kbd class="key-press">Key Press</kbd> keycap styles.',
              whyMatters: 'Consistent visual cues help students distinguish clickable GUI labels from physical keyboard shortcuts.',
              termPrompt: '',
              termCommand: '',
              termOutput: '',
              images: []
            },
            {
              id: 'demo-step-2',
              instruction: 'Command Pill & Terminal Output Demo: Run <code class="cmd-inline">ipconfig /all</code> and press <kbd class="key-press">Enter</kbd> to verify host addressing.',
              whatDoing: 'Verifying static IP and DNS configuration from the CLI.',
              whyMatters: 'Terminal boxes maintain readable dark-slate contrast in both Light and Dark VLP modes.',
              termPrompt: 'PS C:\\Users\\xadministrator>',
              termCommand: 'whoami /groups',
              termOutput: 'NDSACDC01\\xadministrator\nBUILTIN\\Administrators',
              images: []
            },
            {
              id: 'demo-step-3',
              instruction: 'Inline Image Demo: Compare your active console view with the reference screenshot directly inside this step cell.',
              whatDoing: '',
              whyMatters: '',
              termPrompt: '',
              termCommand: '',
              termOutput: '',
              images: [{ src: './images/step-sample.svg', alt: 'Inline Step Screenshot Example' }]
            }
          ]
        }
      }
    ];
  }

  return {
    MASTER_STYLE_BLOCK: MASTER_STYLE_BLOCK,
    generateUuid: generateUuid,
    escapeHtml: escapeHtml,
    escapeXmlText: escapeXmlText,
    escapeXmlAttr: escapeXmlAttr,
    decodeXmlEntities: decodeXmlEntities,
    stripZeroWidthAndNbsp: stripZeroWidthAndNbsp,
    formatInlineMarkup: formatInlineMarkup,
    extractFilenameFromSrc: extractFilenameFromSrc,
    resolveImageSrc: resolveImageSrc,
    createDefaultOverviewData: createDefaultOverviewData,
    createDefaultStep: createDefaultStep,
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
