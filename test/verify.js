const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const { spawn } = require('child_process');
const JSZip = require('jszip');
const VLP = require('../public/vlp-formatter.js');

function check(name, fn) {
  try {
    const res = fn();
    if (res && typeof res.then === 'function') {
      return res.then(() => console.log('PASS:', name));
    }
    console.log('PASS:', name);
    return Promise.resolve();
  } catch (err) {
    console.error('FAIL:', name);
    console.error(err);
    process.exitCode = 1;
    return Promise.resolve();
  }
}

function httpRequest(port, method, reqPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port,
      path: reqPath,
      method,
      headers: { ...headers }
    };
    let payload = null;
    if (body !== undefined && body !== null) {
      if (Buffer.isBuffer(body)) {
        payload = body;
      } else if (typeof body === 'string') {
        payload = Buffer.from(body, 'utf8');
      } else {
        payload = Buffer.from(JSON.stringify(body), 'utf8');
        if (!opts.headers['Content-Type']) opts.headers['Content-Type'] = 'application/json';
      }
      opts.headers['Content-Length'] = payload.length;
    }

    const req = http.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks)
        });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');

  await check('1. Annex B content.xml parse, format recognition, and XML round-trip', () => {
    const xmlPath = path.join(rootDir, 'dsac.annexb.lab01-en', 'content.xml');
    const xmlStr = fs.readFileSync(xmlPath, 'utf8');
    const manual = VLP.parseXmlToManual(xmlStr);
    assert.strictEqual(manual.name, 'dsac.annexb.lab01');
    assert.strictEqual(manual.defaultLanguageCode, 'en');
    assert.strictEqual(manual.contentNodes.length, 1);

    const rootNode = manual.contentNodes[0];
    assert.strictEqual(rootNode.mode, 'overview');
    assert.strictEqual(rootNode.overview.courseTitle, 'WINDOWS SERVER 2022');
    assert.strictEqual(rootNode.overview.purposeEnabled, true);

    // Chapter 0: Set Correct Date and Time (overview + Step 1 formatted table)
    const ch0 = rootNode.children[0];
    assert.strictEqual(ch0.mode, 'overview');
    assert.strictEqual(ch0.overview.credentialsEnabled, true);
    assert.strictEqual(ch0.overview.credentialsList[0].targetSystem, 'NDSACDC01');
    assert.strictEqual(ch0.overview.credentialsList[0].username, 'xadministrator');

    const ch0Step1 = ch0.children[0];
    assert.strictEqual(ch0Step1.mode, 'steps');
    assert.strictEqual(ch0Step1.stepsData.steps.length, 6);
    assert.strictEqual(ch0Step1.stepsData.steps[0].images.length, 1);

    // Chapter 1: Disable Firewall has custom experimental nodes (Step 1 v1, Step 2 v1) preserved in raw mode
    const ch1 = rootNode.children[1];
    assert.strictEqual(ch1.children.length, 10);
    const v1Node = ch1.children.find((c) => c.title === 'Step 1 v1');
    assert.strictEqual(v1Node.mode, 'raw');

    const serialized = VLP.serializeManualToXml(manual);
    const reparsed = VLP.parseXmlToManual(serialized);
    assert.strictEqual(reparsed.name, manual.name);
    assert.strictEqual(reparsed.contentNodes[0].children.length, rootNode.children.length);
    assert.strictEqual(reparsed.contentNodes[0].children[0].children[0].stepsData.steps.length, 6);
  });

  await check('2. Annex C content.xml parse and Chapter Step Consolidation', () => {
    const xmlPath = path.join(rootDir, 'dsac.annexc.lab01-en', 'content.xml');
    const xmlStr = fs.readFileSync(xmlPath, 'utf8');
    const manual = VLP.parseXmlToManual(xmlStr);
    assert.strictEqual(manual.name, 'dsac.annexc.lab01');
    const rootNode = manual.contentNodes[0];
    assert.strictEqual(rootNode.children.length, 4);

    // Consolidate chapter 0 (Configuring DCUI: 12 steps)
    const ch0 = rootNode.children[0];
    assert.strictEqual(ch0.children.length, 12);
    const consolidated = VLP.consolidateChapterSteps(ch0);
    assert.strictEqual(consolidated.mode, 'overview');
    assert.strictEqual(consolidated.children.length, 1);
    const stepPage = consolidated.children[0];
    assert.strictEqual(stepPage.mode, 'steps');
    assert.strictEqual(stepPage.stepsData.steps.length, 12);
    // Ensure inline images mapped 1-to-1 and legacy Calibri/zero-width stripped
    const html = VLP.generateNodeHtml(stepPage, { imageMode: 'vlp' });
    assert(html.includes('<style>'), 'Missing Master <style> block');
    assert(html.includes('class="lab-wrapper"'));
    assert(html.includes('class="lab-table"'));
    assert(html.includes('class="step-inline-img"'));
    assert(!html.includes('Calibri'), 'Legacy Calibri font leaked');
    assert(!html.includes('\u200B'), 'Zero-width space leaked');

    // Also test Annex B Chapter 2 (Configure network adapter settings) merges context text without auto-fill labels
    const annexB = VLP.parseXmlToManual(fs.readFileSync(path.join(rootDir, 'dsac.annexb.lab01-en', 'content.xml'), 'utf8'));
    const ch2 = annexB.contentNodes[0].children[2];
    const ch2Consolidated = VLP.consolidateChapterSteps(ch2);
    const ch2Html = VLP.generateNodeHtml(ch2Consolidated.children[0], { imageMode: 'vlp' });
    assert(ch2Html.includes('class="step-context"'));
    assert(ch2Html.includes('This opens the network configuration for the server.'));
    assert(!ch2Html.includes('What you are doing:'));
    assert(!ch2Html.includes('Why this matters:'));
  });

  await check('3. Strict non-heuristic formatting & explicit markup shortcuts', () => {
    const raw = [
      '1. Click **Start**, type `gpedit.msc`, and press [[Enter]].',
      'What you are doing: Opening Local Group Policy Editor.',
      'Why this matters: Manages security controls.',
      '2. Run sudo whoami and press Enter without markup.'
    ].join('\n');

    const parsed = VLP.parseRawTextToSteps(raw);
    assert.strictEqual(parsed.steps.length, 2);
    assert.strictEqual(parsed.steps[0].contextText, 'Opening Local Group Policy Editor.\nManages security controls.');

    const html = VLP.generateProceduralStepsHtml({
      sectionTitle: 'Test Section',
      introText: 'Intro text with [ui]Server Manager[/ui].',
      steps: parsed.steps
    });
    assert(html.includes('<span class="ui-target">Start</span>'));
    assert(html.includes('<code class="cmd-inline">gpedit.msc</code>'));
    assert(html.includes('<kbd class="key-press">Enter</kbd>'));
    assert(html.includes('<span class="ui-target">Server Manager</span>'));
    assert(!html.includes('What you are doing:'));
    assert(!html.includes('Why this matters:'));
    // Step 2 had NO explicit markup or toolbar tags, so sudo / Enter must NOT be auto-tagged!
    assert(html.includes('Run sudo whoami and press Enter without markup.'));
    assert(!html.includes('<code class="cmd-inline">sudo'));
  });

  await check('4. Master CSS, Templates, & Offline Air-Gapped Asset Audit', () => {
    const tplList = VLP.getTemplates();
    assert.strictEqual(tplList.length, 4);
    tplList.forEach((tpl) => {
      const html = tpl.mode === 'overview'
        ? VLP.generateCourseOverviewHtml(tpl.overview)
        : VLP.generateProceduralStepsHtml(tpl.stepsData);
      assert(html.includes('--vlp-accent-red: #dc2626;'));
      assert(html.includes('[clr-theme="dark"]'));
      assert(!/https?:\/\//i.test(html), 'Template output must not contain external URLs');
    });

    const catalog = VLP.getToolbarCatalog();
    assert.strictEqual(catalog.length, 22);

    const indexHtml = fs.readFileSync(path.join(rootDir, 'public', 'index.html'), 'utf8');
    const stylesCss = fs.readFileSync(path.join(rootDir, 'public', 'styles.css'), 'utf8');
    assert(!/https?:\/\//i.test(indexHtml), 'index.html must not reference external CDNs');
    assert(!/https?:\/\//i.test(stylesCss), 'styles.css must not reference external URLs');
  });

  await check('4c. v0.3.5-beta UX: Streamlined Header, Bug Report, Dark-First Default, Custom Swatches, VLP Ratio, MFA QR, My Projects & Hidden Raw Converter', () => {
    const indexHtml = fs.readFileSync(path.join(rootDir, 'public', 'index.html'), 'utf8');
    const appJs = fs.readFileSync(path.join(rootDir, 'public', 'app.js'), 'utf8');

    assert(indexHtml.includes('v0.3.5-beta'), 'index.html badge should display v0.3.5-beta');
    assert(indexHtml.includes('data-owui-tab="projects"'), 'index.html user menu must include My Projects tab');
    assert(appJs.includes('buildCompactImageMap('), 'app.js must deduplicate & strip dataUrl bloat via buildCompactImageMap');
    assert(appJs.includes('parseJsonResponse('), 'app.js must safely parse non-JSON HTTP responses via parseJsonResponse');
    assert(appJs.includes('renderOwuiProjectsTab('), 'app.js must render My Projects tab');
    assert(indexHtml.includes('id="quickPastePanel" class="hidden"'), 'quickPastePanel must default to hidden on load');
    assert(indexHtml.includes('data-guide-id="raw-text-converter"'), 'Raw Text Converter card header must link to Button Demo Guide');
    assert(indexHtml.includes('id="quickPasteModeSelect"'), 'Raw Text Converter must include split mode selector');
    assert(indexHtml.includes('id="quickPasteUnwrapToggle"'), 'Raw Text Converter must include unwrap paragraph lines toggle');
    assert(indexHtml.includes('id="quickPasteStatusBox"'), 'Raw Text Converter must include validation status diagnostics box');
    assert(appJs.includes('setQuickPasteVisible(false)'), 'app.js must initialize quickPastePanel hidden');
    assert(appJs.includes("document.querySelectorAll('[data-guide-id]')"), 'app.js must bind all data-guide-id help triggers');
    assert(indexHtml.includes('id="btnUndo"'), 'index.html should contain Undo button');
    assert(indexHtml.includes('id="btnRedo"'), 'index.html should contain Redo button');
    assert(indexHtml.includes('id="chkHideGuideStartup"'), 'index.html should contain startup guide opt-out checkbox');
    assert(indexHtml.includes('id="btnExportMenu"'), 'index.html should contain unified Export menu trigger');
    assert(indexHtml.includes('id="exportMenuPopover"'), 'index.html should contain Export popover menu');
    assert(indexHtml.includes('id="btnExportXml"'), 'index.html should contain Export XML button inside Export popover');
    assert(indexHtml.includes('id="btnExportZip"'), 'index.html should contain Export ZIP button inside Export popover');
    assert(indexHtml.includes('id="exportScopeSelect"'), 'index.html should contain Export scope dropdown');
    assert(indexHtml.includes('id="btnUiThemeToggle"'), 'index.html should contain Dark/Light UI toggle button');
    assert(indexHtml.includes('id="colorThemeDropdown"'), 'index.html should contain custom Color Theme Swatches dropdown');
    assert(indexHtml.includes('id="previewRatioSelect"'), 'index.html should contain VLP Ratio preview width selector');
    assert(indexHtml.includes('id="mobilePaneTabs"'), 'index.html should contain responsive mobile/zoom pane switcher');
    assert(indexHtml.includes('id="btnReportBug"'), 'index.html should contain Report Bug button');
    assert(indexHtml.includes('id="authGateOverlay"'), 'index.html should contain authentication gate overlay');
    assert(indexHtml.includes('id="accountAdminModal"'), 'index.html should contain Open WebUI-style account/admin modal');

    assert(!indexHtml.includes('id="btnLoadAnnexB"'), 'Decluttered topbar must not contain standalone btnLoadAnnexB');
    assert(!indexHtml.includes('id="btnLoadAnnexC"'), 'Decluttered topbar must not contain standalone btnLoadAnnexC');
    assert(!indexHtml.includes('id="btnOpenSessions"'), 'Decluttered topbar must not contain standalone btnOpenSessions');

    assert(!/https?:\/\//i.test(appJs), 'app.js must not reference external URLs');
    assert(appJs.includes('vlp_hide_guide_on_startup'), 'app.js should persist startup guide preference in localStorage');
    assert(appJs.includes('performRedo()'), 'app.js should define performRedo()');
    assert(appJs.includes('armTypingUndo('), 'app.js should define armTypingUndo()');
    assert(appJs.includes('doc.body.innerHTML = previewHtmlSnippet'), 'app.js should update preview iframe DOM in-place to preserve scroll');
    assert(appJs.includes('exportDocument('), 'app.js should define exportDocument()');
    assert(appJs.includes('openBugReport('), 'app.js should define openBugReport()');
    assert(appJs.includes('mfa-qr-img') && appJs.includes('btnCopyMfaSecret'), 'app.js should render offline TOTP QR image and manual setup key copy button');
    assert(appJs.includes('renderOwuiAdminAuthTab'), 'app.js should include Open WebUI-style admin Authentication tab');
    assert(/previewTheme\s*:\s*['"]dark['"]/.test(appJs), 'app.js should default previewTheme to dark mode');
  });

  await check('4d. v0.3.3-beta VLP Split-Screen Scaling, Step Header Alignment & Light/Dark Context CSS Isolation', () => {
    const cssBlock = VLP.getMasterStyleBlock('crimson-slate');
    assert(cssBlock.includes('table-layout: fixed'), 'Master style must enforce table-layout: fixed for VLP split-screen');
    assert(cssBlock.includes('max-width: 100% !important'), 'Master style must constrain wide images with max-width: 100% !important');
    assert(cssBlock.includes('overflow-wrap: anywhere'), 'Master style must wrap long commands/tokens via overflow-wrap: anywhere');
    assert(cssBlock.includes('width: 68px !important') && cssBlock.includes('white-space: nowrap'), 'col-step-num header must prevent STEP mid-word wrapping');
    assert(cssBlock.includes('@container vlp-manual'), 'Master style must define @container vlp-manual responsive rules');
    assert(cssBlock.includes('not(.theme-light)'), 'Master style must isolate dark prefers-color-scheme from Light mode (.theme-light)');

    const sampleNode = {
      id: 'st-scale-1',
      title: 'Split Screen Scaling Test',
      mode: 'steps',
      overview: VLP.createDefaultOverviewData(),
      stepsData: {
        sectionTitle: 'Verify Responsive Table',
        introText: 'Ensure wide images and long commands fit VLP taskbar.',
        steps: [
          {
            id: 'r1',
            instruction: 'Run `ip addr show` and inspect output.',
            contextText: 'Must remain legible in Light Mode even when OS prefers dark.',
            credentialsList: [],
            tables: [],
            termPrompt: '',
            termCommand: '',
            termOutput: '',
            images: [{ src: './images/wide-screenshot.png', alt: 'Wide Screenshot' }]
          }
        ]
      },
      rawHtml: '',
      images: [],
      children: []
    };

    const emittedHtml = VLP.generateNodeHtml(sampleNode, { colorTheme: 'crimson-slate', imageMode: 'vlp' });
    assert(emittedHtml.includes('class="col-step-num"'), 'Procedural steps table header should emit class="col-step-num"');

    const reparsed = VLP.parseHtmlToNodeState(emittedHtml, sampleNode.title);
    assert.strictEqual(reparsed.mode, 'steps');
    assert.strictEqual(reparsed.stepsData.steps.length, 1);
    assert.strictEqual(reparsed.stepsData.steps[0].contextText, 'Must remain legible in Light Mode even when OS prefers dark.');
    assert.strictEqual(reparsed.stepsData.steps[0].images.length, 1);
  });

  await check('4b. v0.2.0-beta Features: Color Themes, Rich Text, Multi-VM Creds, Nested Tables & Round-Trip', () => {
    const themes = VLP.getColorThemes();
    assert.strictEqual(themes.length, 8);

    // Rich text, nested tables, multi-VM creds in overview & inside steps, single context block, and Cobalt theme
    const manual = {
      id: 'm-v2',
      name: 'v2.feature.test',
      defaultLanguageCode: 'en',
      dataFormat: 'default',
      colorTheme: 'cobalt-sky',
      contentNodes: [
        {
          id: 'ov-1',
          title: 'Overview',
          mode: 'overview',
          overview: {
            courseTitle: 'NETWORK LAB',
            overviewText: 'Text with <strong>bold</strong>, <em>italic</em>, <u>underline</u>, <s>strike</s>, and <mark class="vlp-highlight">highlight</mark>.\n\n<ul>\n  <li>Item A</li>\n  <li>Item B</li>\n</ul>',
            tables: [
              VLP.createDefaultTable({
                title: 'Subnet Matrix',
                hasHeader: true,
                rows: [['VLAN', 'Subnet'], ['10', '192.168.10.0/24'], ['40', '192.168.40.0/24']]
              })
            ],
            showDivider: true,
            purposeEnabled: false,
            credentialsEnabled: true,
            credentialsTitle: 'Target VM Credentials',
            credentialsList: [
              VLP.createDefaultCredentialEntry({ targetSystem: 'NDSACDC01', username: 'xadministrator', password: 'pw1' }),
              VLP.createDefaultCredentialEntry({ targetSystem: 'NDSACESXI01', username: 'root', password: 'pw2' })
            ]
          },
          stepsData: VLP.createDefaultStepsData(),
          rawHtml: '',
          images: [],
          children: [
            {
              id: 'st-page-1',
              title: 'Step 1',
              mode: 'steps',
              overview: VLP.createDefaultOverviewData(),
              stepsData: {
                sectionTitle: 'Configure Multiple Hosts',
                introText: 'Verify host parameters.',
                credentialsEnabled: true,
                credentialsTitle: 'Page VM Creds',
                credentialsList: [
                  VLP.createDefaultCredentialEntry({ targetSystem: 'HOST-A', username: 'adminA', password: 'pA' })
                ],
                tables: [
                  VLP.createDefaultTable({ title: 'Intro Matrix', hasHeader: true, rows: [['Key', 'Val'], ['DNS', '192.168.40.2']] })
                ],
                steps: [
                  {
                    id: 'row-1',
                    instruction: 'Apply settings from the table below.',
                    contextText: 'Highlighted context note with zero auto-filled labels.',
                    credentialsList: [
                      VLP.createDefaultCredentialEntry({ targetSystem: 'NDSACESXI02', username: 'root', password: 'pw3' }),
                      VLP.createDefaultCredentialEntry({ targetSystem: 'NDSACESXI03', username: 'root', password: 'pw4' })
                    ],
                    tables: [
                      VLP.createDefaultTable({ title: 'ESXi IPs', hasHeader: true, rows: [['Host', 'IP'], ['ESXI02', '192.168.10.12'], ['ESXI03', '192.168.10.13']] })
                    ],
                    termPrompt: '',
                    termCommand: '',
                    termOutput: '',
                    images: []
                  }
                ]
              },
              rawHtml: '',
              images: [],
              children: []
            }
          ]
        }
      ]
    };

    const xmlOut = VLP.serializeManualToXml(manual);
    const reparsed = VLP.parseXmlToManual(xmlOut);
    assert.strictEqual(reparsed.colorTheme, 'cobalt-sky');

    const ovNode = reparsed.contentNodes[0];
    assert.strictEqual(ovNode.mode, 'overview');
    assert.strictEqual(ovNode.overview.tables.length, 1);
    assert.strictEqual(ovNode.overview.tables[0].title, 'Subnet Matrix');
    assert.strictEqual(ovNode.overview.credentialsList.length, 2);
    assert.strictEqual(ovNode.overview.credentialsList[1].targetSystem, 'NDSACESXI01');

    const stNode = ovNode.children[0];
    assert.strictEqual(stNode.mode, 'steps');
    assert.strictEqual(stNode.stepsData.credentialsList.length, 1);
    assert.strictEqual(stNode.stepsData.tables.length, 1);
    assert.strictEqual(stNode.stepsData.steps.length, 1);
    assert.strictEqual(stNode.stepsData.steps[0].contextText, 'Highlighted context note with zero auto-filled labels.');
    assert.strictEqual(stNode.stepsData.steps[0].credentialsList.length, 2);
    assert.strictEqual(stNode.stepsData.steps[0].tables.length, 1);
    assert.strictEqual(stNode.stepsData.steps[0].tables[0].rows.length, 3);

    const stepHtml = VLP.generateNodeHtml(stNode, { colorTheme: 'cobalt-sky' });
    assert(stepHtml.includes('--vlp-accent-red: #2563eb;'));
    assert(stepHtml.includes('class="vlp-data-table"'));
    assert(stepHtml.includes('class="lab-note-entry"'));

    // Verify Annex C IPv4 Configuration legacy <table> elements convert into step.tables[]
    const annexC = VLP.parseXmlToManual(fs.readFileSync(path.join(rootDir, 'dsac.annexc.lab01-en', 'content.xml'), 'utf8'));
    const dcuiConsolidated = VLP.consolidateChapterSteps(annexC.contentNodes[0].children[0]);
    const ipv4Step = dcuiConsolidated.children[0].stepsData.steps[6]; // IPv4 Configuration
    assert.strictEqual(ipv4Step.tables.length, 3);
    assert.strictEqual(ipv4Step.tables[0].title, 'NDSACESXI01');
  });

  // Start server on ephemeral test port with temporary data directory
  const tmpDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vlp-test-'));
  const testPort = 18089;
  const serverProc = spawn(process.execPath, [path.join(rootDir, 'server.js')], {
    env: { ...process.env, PORT: String(testPort), DATA_DIR: tmpDataDir },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server startup timeout')), 6000);
    serverProc.stdout.on('data', (chunk) => {
      if (chunk.toString().includes(String(testPort))) {
        clearTimeout(timer);
        resolve();
      }
    });
    serverProc.stderr.on('data', (chunk) => {
      console.error('SERVER ERR:', chunk.toString());
    });
  });

  try {
    await check('5. HTTP API: /api/health, static index.html, and sample manuals', async () => {
      const h = await httpRequest(testPort, 'GET', '/api/health');
      assert.strictEqual(h.status, 200);
      const healthJson = JSON.parse(h.body.toString());
      assert.strictEqual(healthJson.ok, true);
      assert.strictEqual(healthJson.version, '0.3.5-beta');
      assert(String(healthJson.issueUrl || '').includes('/issues/new'), '/api/health should expose GitHub issueUrl');

      const idx = await httpRequest(testPort, 'GET', '/');
      assert.strictEqual(idx.status, 200);
      assert(idx.body.toString().includes('VLP Manual HTML Formatter'));

      const ab = await httpRequest(testPort, 'GET', '/api/samples/annexb');
      assert.strictEqual(ab.status, 200);
      assert.strictEqual(JSON.parse(ab.body.toString()).manual.name, 'dsac.annexb.lab01');

      const ac = await httpRequest(testPort, 'GET', '/api/samples/annexc');
      assert.strictEqual(ac.status, 200);
      assert.strictEqual(JSON.parse(ac.body.toString()).manual.name, 'dsac.annexc.lab01');
    });

    await check('6. HTTP API: Dual session autosave, snapshots, and persistent images', async () => {
      const png1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
      const imgRes = await httpRequest(testPort, 'POST', '/api/images', {
        filename: 'test-img.png',
        dataUrl: png1x1
      });
      assert.strictEqual(imgRes.status, 200);
      const imgJson = JSON.parse(imgRes.body.toString());
      assert.strictEqual(imgJson.src, './images/test-img.png');

      const fetchedImg = await httpRequest(testPort, 'GET', imgJson.previewUrl);
      assert.strictEqual(fetchedImg.status, 200);
      assert(fetchedImg.body.length > 20);

      const sampleManual = {
        id: 'm1',
        name: 'test.manual',
        defaultLanguageCode: 'en',
        dataFormat: 'default',
        contentNodes: [
          {
            id: 'n1',
            title: 'Step 1',
            mode: 'steps',
            overview: VLP.createDefaultOverviewData(),
            stepsData: {
              sectionTitle: 'Verify ZIP Image',
              introText: '',
              steps: [
                {
                  id: 's1',
                  instruction: 'Run `whoami` and press [[Enter]].',
                  whatDoing: '',
                  whyMatters: '',
                  termPrompt: '[admin@host ~]$',
                  termCommand: 'whoami',
                  termOutput: 'admin',
                  images: [{ src: './images/test-img.png', alt: 'Test Screenshot', width: '1', height: '1' }]
                }
              ]
            },
            rawHtml: '',
            images: [],
            children: []
          }
        ]
      };

      const autoSave = await httpRequest(testPort, 'POST', '/api/sessions/autosave', { manual: sampleManual });
      assert.strictEqual(autoSave.status, 200);

      const getAuto = await httpRequest(testPort, 'GET', '/api/sessions/autosave');
      assert.strictEqual(JSON.parse(getAuto.body.toString()).session.state.manual.name, 'test.manual');

      const snapSave = await httpRequest(testPort, 'POST', '/api/sessions/save', {
        id: 'ckpt-1',
        name: 'Checkpoint 1',
        state: { manual: sampleManual }
      });
      assert.strictEqual(snapSave.status, 200);

      const listSnaps = await httpRequest(testPort, 'GET', '/api/sessions');
      assert.strictEqual(JSON.parse(listSnaps.body.toString()).sessions.length, 1);

      // Export ZIP and Import ZIP round-trip
      const zipRes = await httpRequest(testPort, 'POST', '/api/export-zip', {
        manual: sampleManual,
        imagesMeta: { 'test-img.png': { filename: 'test-img.png', width: '1', height: '1' } }
      });
      assert.strictEqual(zipRes.status, 200);

      const zip = await JSZip.loadAsync(zipRes.body);
      const keys = Object.keys(zip.files);
      assert(keys.some((k) => k.endsWith('/content.xml')), 'ZIP missing content.xml');
      assert(keys.some((k) => k.endsWith('/images/test-img.png')), 'ZIP missing images/test-img.png');

      const impRes = await httpRequest(testPort, 'POST', '/api/import-zip', zipRes.body, {
        'Content-Type': 'application/zip'
      });
      assert.strictEqual(impRes.status, 200);
      const impJson = JSON.parse(impRes.body.toString());
      assert.strictEqual(impJson.manual.name, 'test.manual');
      assert(impJson.imageMap['test-img.png'], 'Imported ZIP did not return imageMap entry');

      // Delete snapshot
      const delRes = await httpRequest(testPort, 'DELETE', '/api/sessions/ckpt-1');
      assert.strictEqual(delRes.status, 200);
    });

    await check('7. Student Document Exports (.pdf, .html, .mdx, .rtf) with Inline Images & Themes', async () => {
      const exportManual = {
        id: 'exp-1',
        name: 'student.export.lab',
        defaultLanguageCode: 'en',
        dataFormat: 'default',
        colorTheme: 'cobalt-sky',
        contentNodes: [
          {
            id: 'node-ov',
            title: 'Lab Introduction',
            mode: 'overview',
            overview: {
              courseTitle: 'ENTERPRISE LINUX LAB',
              overviewText: 'Welcome **Student** to `bash` training.',
              showDivider: true,
              purposeEnabled: true,
              purposeTitle: 'Learning Goal',
              purposeText: 'Master <strong>basic CLI</strong> diagnostics.',
              credentialsEnabled: true,
              credentialsTitle: 'Lab VM Access',
              credentialsList: [VLP.createDefaultCredentialEntry({ targetSystem: 'SRV01', username: 'student', password: 'LabPassword1!' })],
              tables: [VLP.createDefaultTable({ title: 'Inventory', hasHeader: true, rows: [['Host', 'IP'], ['SRV01', '10.10.0.5']] })]
            },
            stepsData: VLP.createDefaultStepsData(),
            rawHtml: '',
            images: [],
            children: [
              {
                id: 'node-st',
                title: 'Exercise 1',
                mode: 'steps',
                overview: VLP.createDefaultOverviewData(),
                stepsData: {
                  sectionTitle: 'Verify Shell & Hostname',
                  introText: 'Complete each step carefully.',
                  steps: [
                    {
                      id: 's-1',
                      instruction: 'Type `hostnamectl` and press [[Enter]].',
                      contextText: 'Shows Linux distribution and kernel release.',
                      credentialsList: [],
                      tables: [],
                      termPrompt: '[student@srv01 ~]$',
                      termCommand: 'hostnamectl',
                      termOutput: 'Static hostname: srv01',
                      images: [{ src: './images/test-img.png', alt: 'Host Output' }]
                    }
                  ]
                },
                rawHtml: '',
                images: [],
                children: []
              }
            ]
          }
        ]
      };

      const pdfRes = await httpRequest(testPort, 'POST', '/api/export-document', {
        manual: exportManual,
        format: 'pdf',
        scope: 'full'
      });
      assert.strictEqual(pdfRes.status, 200);
      assert(String(pdfRes.headers['content-type']).includes('application/pdf'));
      const pdfStr = pdfRes.body.toString('latin1');
      assert(pdfStr.startsWith('%PDF-1.4'), 'PDF must start with %PDF-1.4 header');
      assert(pdfStr.includes('%%EOF'), 'PDF must end with %%EOF');
      assert(pdfStr.includes('/Subtype /Image'), 'PDF should embed uploaded PNG as Image XObject');

      const htmlRes = await httpRequest(testPort, 'POST', '/api/export-document', {
        manual: exportManual,
        format: 'html',
        scope: 'full'
      });
      assert.strictEqual(htmlRes.status, 200);
      const htmlBody = htmlRes.body.toString('utf8');
      assert(htmlBody.includes('<!DOCTYPE html>') && htmlBody.includes('ENTERPRISE LINUX LAB'));
      assert(htmlBody.includes('data:image/png;base64,'), 'Standalone HTML must inline base64 images');
      assert(htmlBody.includes('@media print'), 'Standalone HTML must include print stylesheet');

      const mdxRes = await httpRequest(testPort, 'POST', '/api/export-document', {
        manual: exportManual,
        format: 'mdx',
        scope: 'current',
        activeNodeId: 'node-st'
      });
      assert.strictEqual(mdxRes.status, 200);
      const mdxBody = mdxRes.body.toString('utf8');
      assert(mdxBody.startsWith('---') && mdxBody.includes('scope: "current"'));
      assert(mdxBody.includes('```bash') && mdxBody.includes('<kbd>Enter</kbd>'));

      const rtfRes = await httpRequest(testPort, 'POST', '/api/export-document', {
        manual: exportManual,
        format: 'rtf',
        scope: 'full'
      });
      assert.strictEqual(rtfRes.status, 200);
      const rtfBody = rtfRes.body.toString('utf8');
      assert(rtfBody.startsWith('{\\rtf1\\ansi') && rtfBody.includes('\\trowd') && rtfBody.includes('\\pngblip') && rtfBody.trim().endsWith('}'));
    });

    await check('8. Multi-User Auth, AES-256-GCM PII Encryption, Per-User Isolation & Admin Controls', async () => {
      function extractCookie(res) {
        const sc = res.headers['set-cookie'];
        if (!sc || !sc.length) return '';
        return sc[0].split(';')[0];
      }

      const st0 = await httpRequest(testPort, 'GET', '/api/auth/status');
      assert.strictEqual(JSON.parse(st0.body.toString()).needsSetup, true);

      // 1. First-User Admin Bootstrap
      const adminSignup = await httpRequest(testPort, 'POST', '/api/auth/signup', {
        name: 'Alice Admin',
        email: 'alice@lab.local',
        username: 'aliceadmin',
        password: 'StrongAdminPw!1'
      });
      assert.strictEqual(adminSignup.status, 201);
      const adminCookie = extractCookie(adminSignup);
      const adminJson = JSON.parse(adminSignup.body.toString());
      assert.strictEqual(adminJson.user.role, 'admin');

      // Inspect raw users.json on disk: zero plaintext PII or passwords allowed
      const rawUsersDisk = fs.readFileSync(path.join(tmpDataDir, 'users.json'), 'utf8');
      assert(!rawUsersDisk.includes('alice@lab.local'), 'users.json must NOT contain plaintext email');
      assert(!rawUsersDisk.includes('Alice Admin'), 'users.json must NOT contain plaintext name');
      assert(!rawUsersDisk.includes('aliceadmin'), 'users.json must NOT contain plaintext username');
      assert(!rawUsersDisk.includes('StrongAdminPw!1'), 'users.json must NOT contain plaintext password');
      assert(rawUsersDisk.includes('enc:v1:') && rawUsersDisk.includes('scrypt$'), 'users.json must store AES-256-GCM PII & scrypt hashes');

      // Unauthenticated requests are now blocked
      const unauthSess = await httpRequest(testPort, 'GET', '/api/sessions');
      assert.strictEqual(unauthSess.status, 401);

      // 2. Second User Sign-Up defaults to pending
      const bobSignup = await httpRequest(testPort, 'POST', '/api/auth/signup', {
        name: 'Bob Student',
        email: 'bob@lab.local',
        username: 'bobstu',
        password: 'StudentPw!234'
      });
      assert.strictEqual(bobSignup.status, 201);
      const bobCookie = extractCookie(bobSignup);
      const bobJson = JSON.parse(bobSignup.body.toString());
      assert.strictEqual(bobJson.user.role, 'pending');

      // Pending Bob cannot access workspace sessions or admin APIs
      const bobPendingSess = await httpRequest(testPort, 'GET', '/api/sessions', null, { Cookie: bobCookie });
      assert.strictEqual(bobPendingSess.status, 403);
      const bobAdminAttempt = await httpRequest(testPort, 'GET', '/api/admin/users', null, { Cookie: bobCookie });
      assert.strictEqual(bobAdminAttempt.status, 403);

      // Wrong password rejected cleanly
      const badLogin = await httpRequest(testPort, 'POST', '/api/auth/login', {
        identifier: 'alice@lab.local',
        password: 'WrongPassword99'
      });
      assert.strictEqual(badLogin.status, 401);

      // 3. Admin creates a Group, approves Bob -> 'user', and configures Authentication settings
      const grpRes = await httpRequest(testPort, 'POST', '/api/admin/groups', {
        name: 'Instructors',
        description: 'Lab cohort authors'
      }, { Cookie: adminCookie });
      assert.strictEqual(grpRes.status, 201);
      const grpId = JSON.parse(grpRes.body.toString()).group.id;

      const approveBob = await httpRequest(testPort, 'PUT', '/api/admin/users/' + encodeURIComponent(bobJson.user.id), {
        role: 'user',
        groupId: grpId
      }, { Cookie: adminCookie });
      assert.strictEqual(approveBob.status, 200);

      // Role change increments sessionVersion -> Bob signs in again with fresh approved token
      const bobLogin = await httpRequest(testPort, 'POST', '/api/auth/login', {
        identifier: 'bobstu',
        password: 'StudentPw!234'
      });
      assert.strictEqual(bobLogin.status, 200);
      const bobActiveCookie = extractCookie(bobLogin);

      // 4. Verify Per-User Workspace Isolation & Shared Team Manuals
      await httpRequest(testPort, 'POST', '/api/sessions/save', {
        id: 'alice-priv',
        name: 'Alice Private Lab',
        state: { manual: { id: 'm-a', name: 'alice.manual', contentNodes: [] } }
      }, { Cookie: adminCookie });

      await httpRequest(testPort, 'POST', '/api/sessions/save', {
        id: 'bob-priv',
        name: 'Bob Private Lab',
        state: { manual: { id: 'm-b', name: 'bob.manual', contentNodes: [] } }
      }, { Cookie: bobActiveCookie });

      const bobList = JSON.parse((await httpRequest(testPort, 'GET', '/api/sessions', null, { Cookie: bobActiveCookie })).body.toString());
      assert.strictEqual(bobList.sessions.length, 1);
      assert.strictEqual(bobList.sessions[0].id, 'bob-priv');

      const crossRead = await httpRequest(testPort, 'GET', '/api/sessions/alice-priv', null, { Cookie: bobActiveCookie });
      assert.strictEqual(crossRead.status, 404, 'Bob must not see Alice private snapshot');

      await httpRequest(testPort, 'POST', '/api/sessions-shared', {
        id: 'shared-1',
        name: 'Team Template Lab',
        state: { manual: { id: 'm-s', name: 'team.manual', contentNodes: [] } }
      }, { Cookie: adminCookie });

      const sharedList = JSON.parse((await httpRequest(testPort, 'GET', '/api/sessions-shared', null, { Cookie: bobActiveCookie })).body.toString());
      assert.strictEqual(sharedList.sessions.length, 1);
      assert.strictEqual(sharedList.sessions[0].authorName, 'Alice Admin');

      // 5. Verify Admin Authentication config persists & encrypts OAuth/LDAP secrets on disk
      const cfgSave = await httpRequest(testPort, 'PUT', '/api/admin/auth-config', {
        defaultUserRole: 'user',
        enableOauthPersistentConfig: true,
        oauthEnabled: true,
        oauthProviderName: 'CorpSSO',
        oauthClientSecret: 'super-secret-oauth-99',
        ldapEnabled: true,
        ldapBindPassword: 'ldap-secret-77',
        pendingOverlayTitle: 'Custom Pending Notice'
      }, { Cookie: adminCookie });
      assert.strictEqual(cfgSave.status, 200);
      const savedCfgView = JSON.parse(cfgSave.body.toString()).config;
      assert.strictEqual(savedCfgView.hasOauthClientSecret, true);
      assert.strictEqual(savedCfgView.oauthClientSecret, '');
      assert.strictEqual(savedCfgView.hasLdapBindPassword, true);

      const rawCfgDisk = fs.readFileSync(path.join(tmpDataDir, 'auth-config.json'), 'utf8');
      assert(!rawCfgDisk.includes('super-secret-oauth-99'), 'OAuth secret must be encrypted on disk');
      assert(!rawCfgDisk.includes('ldap-secret-77'), 'LDAP password must be encrypted on disk');

      // 6. Verify Offline TOTP MFA Setup returns scannable QR PNG DataURL & formatted Manual Key + enforces 6-digit login
      const mfaSetupRes = await httpRequest(testPort, 'POST', '/api/auth/mfa/setup', {}, { Cookie: bobActiveCookie });
      assert.strictEqual(mfaSetupRes.status, 200);
      const mfaSetup = JSON.parse(mfaSetupRes.body.toString());
      assert(mfaSetup.secret && mfaSetup.secret.length >= 16, 'MFA setup must return Base32 secret');
      assert(mfaSetup.formattedSecret && mfaSetup.formattedSecret.includes(' '), 'MFA setup must return grouped formattedSecret');
      assert(String(mfaSetup.otpauthUri).startsWith('otpauth://totp/'), 'MFA setup must return otpauth URI');
      assert(String(mfaSetup.qrDataUrl).startsWith('data:image/png;base64,'), 'MFA setup must return offline PNG QR DataURL');

      function testTotp(secretB32) {
        const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = 0, val = 0, bytes = [];
        for (const ch of secretB32.toUpperCase()) {
          const i = alpha.indexOf(ch);
          if (i < 0) continue;
          val = (val << 5) | i; bits += 5;
          if (bits >= 8) { bytes.push((val >>> (bits - 8)) & 255); bits -= 8; }
        }
        const ctr = Math.floor(Date.now() / 30000);
        const msg = Buffer.alloc(8);
        msg.writeUInt32BE(Math.floor(ctr / 0x100000000), 0);
        msg.writeUInt32BE(ctr >>> 0, 4);
        const hmac = crypto.createHmac('sha1', Buffer.from(bytes)).update(msg).digest();
        const off = hmac[hmac.length - 1] & 0x0f;
        const bin = ((hmac[off] & 0x7f) << 24) | ((hmac[off + 1] & 0xff) << 16) | ((hmac[off + 2] & 0xff) << 8) | (hmac[off + 3] & 0xff);
        return String(bin % 1000000).padStart(6, '0');
      }

      const validTotp = testTotp(mfaSetup.secret);
      const mfaEnableRes = await httpRequest(testPort, 'POST', '/api/auth/mfa/enable', { code: validTotp }, { Cookie: bobActiveCookie });
      assert.strictEqual(mfaEnableRes.status, 200);
      assert.strictEqual(JSON.parse(mfaEnableRes.body.toString()).user.mfaEnabled, true);

      const loginWithoutTotp = await httpRequest(testPort, 'POST', '/api/auth/login', { identifier: 'bobstu', password: 'StudentPw!234' });
      assert.strictEqual(loginWithoutTotp.status, 403);
      assert.strictEqual(JSON.parse(loginWithoutTotp.body.toString()).mfaRequired, true);

      const loginWithTotp = await httpRequest(testPort, 'POST', '/api/auth/login', {
        identifier: 'bobstu',
        password: 'StudentPw!234',
        totpCode: testTotp(mfaSetup.secret)
      });
      assert.strictEqual(loginWithTotp.status, 200);
    });

    await check('9. v0.3.4-beta Raw Text Converter: Body Text Preservation, Error Handling & Button Demo Guide Explanation', () => {
      // 1. Guide catalog entry present for Button Demo Guide
      const convGuide = VLP.getToolbarCatalog().find((c) => c.id === 'raw-text-converter');
      assert(convGuide, 'Button Demo Guide must include raw-text-converter explanation card');
      assert(convGuide.demoHtml.includes('How Splitting Works'), 'Converter guide card must explain how splitting works');

      // 2. Unnumbered multi-line wrapped prose stays ONE step (no mid-paragraph breaking!)
      const wrappedProse = [
        'Open Server Manager from the taskbar and wait for the dashboard',
        'to finish enumerating local roles before clicking Manage in the',
        'upper-right corner of the window.'
      ].join('\n');
      const wrappedRes = VLP.parseRawTextToSteps(wrappedProse, { splitMode: 'smart', unwrapPdfLines: true });
      assert.strictEqual(wrappedRes.errors.length, 0);
      assert.strictEqual(wrappedRes.steps.length, 1);
      assert.strictEqual(wrappedRes.detectedMode, 'paragraphs');
      assert(wrappedRes.steps[0].instruction.includes('dashboard to finish enumerating'), 'Wrapped prose lines must rejoin smoothly');

      // 3. Multiple blank-line paragraphs become 1 step per paragraph
      const twoParas = 'First paragraph line one\nline two.\n\nSecond paragraph line one\nline two.';
      const twoParaRes = VLP.parseRawTextToSteps(twoParas, { splitMode: 'smart', unwrapPdfLines: true });
      assert.strictEqual(twoParaRes.steps.length, 2);

      // 4. Numbered steps + IPv4 safety + multi-paragraph continuation within step
      const numberedMulti = [
        'Step 1: Configure static addressing',
        '192.168.10.11 is the management IP for the ESXi host.',
        '',
        'Set gateway to 192.168.10.1 before saving.',
        'Context: Static addressing ensures persistent lab reachability.',
        '2. Verify DNS lookup'
      ].join('\n');
      const numRes = VLP.parseRawTextToSteps(numberedMulti, { splitMode: 'smart', unwrapPdfLines: true });
      assert.strictEqual(numRes.steps.length, 2);
      assert(numRes.steps[0].instruction.includes('192.168.10.11 is the management IP'));
      assert(numRes.steps[0].instruction.includes('Set gateway to 192.168.10.1'));
      assert.strictEqual(numRes.steps[0].contextText, 'Static addressing ensures persistent lab reachability.');

      // 5. Explicit splitMode variations
      const lineModeRes = VLP.parseRawTextToSteps(wrappedProse, { splitMode: 'line' });
      assert.strictEqual(lineModeRes.steps.length, 3);
      const strictNumNoNums = VLP.parseRawTextToSteps(twoParas, { splitMode: 'numbered' });
      assert.strictEqual(strictNumNoNums.steps.length, 1);
      assert(strictNumNoNums.warnings.length >= 1, 'Numbered mode with no step numbers must emit a warning');

      // 6. Error handling for empty, binary PDF, RTF, and VLP XML inputs
      assert(VLP.parseRawTextToSteps('   ').errors.length >= 1, 'Empty input must return actionable error');
      assert(VLP.parseRawTextToSteps('%PDF-1.7 binary').errors.length >= 1, 'PDF header paste must return error');
      assert(VLP.parseRawTextToSteps('{\\rtf1\\ansi test}').errors.length >= 1, 'RTF raw paste must return error');
      assert(VLP.parseRawTextToSteps('<Manual name="x">').errors.length >= 1, 'XML paste must return error');

      // 7. Warning + auto-recovery for unclosed ``` fence and unbalanced shortcuts
      const unclosedRes = VLP.parseRawTextToSteps('1. Click **Start without closing\n```term\nwhoami');
      assert.strictEqual(unclosedRes.steps.length, 1);
      assert(unclosedRes.warnings.some((w) => w.includes('terminal code fence')), 'Unclosed ``` fence must emit warning');
      assert(unclosedRes.warnings.some((w) => w.includes('unclosed **UI Target**')), 'Unclosed ** must emit warning');
      assert.strictEqual(unclosedRes.steps[0].termOutput, 'whoami');
    });

    await check('10. v0.3.5-beta Multi-Project Workspace, Compact Image Persistence & JSON Error Handling', async () => {
      // Sign in as Alice (admin) to test isolated per-user projects
      const aliceLogin = await httpRequest(testPort, 'POST', '/api/auth/login', {
        identifier: 'alice@lab.local',
        password: 'StrongAdminPw!1'
      });
      assert.strictEqual(aliceLogin.status, 200);
      const aliceCookie = aliceLogin.headers['set-cookie'].map((c) => c.split(';')[0]).join('; ');

      // 1. Save a project with inline base64 images -> server extracts them to /data/images/ and strips raw dataUrl from project JSON on disk
      const samplePng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
      const projManualA = {
        id: 'manual-proj-a',
        name: 'openshift.lab01',
        defaultLanguageCode: 'en',
        colorTheme: 'crimson-slate',
        contentNodes: [
          {
            id: 'node-a1',
            title: 'Step 1',
            mode: 'steps',
            overview: VLP.createDefaultOverviewData(),
            stepsData: {
              sectionTitle: 'OpenShift Lab',
              introText: '',
              steps: [
                { id: 'sa1', instruction: 'Deploy pod', contextText: '', termPrompt: '', termCommand: '', termOutput: '', credentialsList: [], tables: [], images: [{ src: './images/shot-a1.png', alt: 'Shot A1' }] },
                { id: 'sa2', instruction: 'Verify service', contextText: '', termPrompt: '', termCommand: '', termOutput: '', credentialsList: [], tables: [], images: [{ src: './images/shot-a2.png', alt: 'Shot A2' }] }
              ]
            },
            rawHtml: '',
            images: [],
            children: []
          }
        ]
      };

      const createA = await httpRequest(testPort, 'POST', '/api/projects', {
        title: 'OpenShift Lab 1',
        state: {
          manual: projManualA,
          activeNodeId: 'node-a1',
          imageMap: {
            'shot-a1.png': { filename: 'shot-a1.png', src: './images/shot-a1.png', dataUrl: samplePng },
            './images/shot-a1.png': { filename: 'shot-a1.png', src: './images/shot-a1.png', dataUrl: samplePng },
            'shot-a2.png': { filename: 'shot-a2.png', src: './images/shot-a2.png', dataUrl: samplePng }
          }
        }
      }, { Cookie: aliceCookie });
      assert.strictEqual(createA.status, 201);
      const projA = JSON.parse(createA.body.toString()).project;
      assert.strictEqual(projA.title, 'OpenShift Lab 1');
      assert.strictEqual(projA.stepCount, 2);
      assert.strictEqual(projA.imageCount, 2);

      // Check stored project on disk has zero embedded data:image/ bloat and extracted files exist in IMAGES_DIR
      assert(fs.existsSync(path.join(tmpDataDir, 'images', 'shot-a1.png')), 'shot-a1.png should be persisted in IMAGES_DIR');
      assert(fs.existsSync(path.join(tmpDataDir, 'images', 'shot-a2.png')), 'shot-a2.png should be persisted in IMAGES_DIR');
      const getARes = await httpRequest(testPort, 'GET', '/api/projects/' + projA.id, null, { Cookie: aliceCookie });
      assert.strictEqual(getARes.status, 200);
      const getABodyStr = getARes.body.toString();
      assert(!getABodyStr.includes('data:image/'), 'Saved project JSON must store lightweight /api/images/ refs, not inline base64 dataUrls');
      const loadedA = JSON.parse(getABodyStr).project;
      assert.strictEqual(Object.keys(loadedA.state.imageMap).length, 2, 'Duplicate ./images/ keys should be deduplicated');

      // 2. Create a second project (Project B), list projects, duplicate, rename, autosave, resume & delete
      const createB = await httpRequest(testPort, 'POST', '/api/projects', {
        title: 'Windows Server Annex B',
        state: {
          manual: { id: 'manual-proj-b', name: 'win.annexb', defaultLanguageCode: 'en', contentNodes: [] },
          activeNodeId: null,
          imageMap: {}
        }
      }, { Cookie: aliceCookie });
      assert.strictEqual(createB.status, 201);
      const projB = JSON.parse(createB.body.toString()).project;

      const listRes = await httpRequest(testPort, 'GET', '/api/projects', null, { Cookie: aliceCookie });
      assert.strictEqual(listRes.status, 200);
      const listed = JSON.parse(listRes.body.toString()).projects;
      assert.strictEqual(listed.length, 2, 'Alice should have 2 saved multi-manual projects');

      const renameRes = await httpRequest(testPort, 'PUT', '/api/projects/' + projB.id, { title: 'Windows Annex B Renamed' }, { Cookie: aliceCookie });
      assert.strictEqual(renameRes.status, 200);
      assert.strictEqual(JSON.parse(renameRes.body.toString()).project.title, 'Windows Annex B Renamed');

      const autoProjRes = await httpRequest(testPort, 'POST', '/api/projects/' + projA.id + '/autosave', {
        manual: projManualA,
        activeNodeId: 'node-a1',
        activeProjectTitle: 'OpenShift Lab 1',
        imageMap: { 'shot-a1.png': { filename: 'shot-a1.png', src: './images/shot-a1.png', previewUrl: '/api/images/shot-a1.png' } }
      }, { Cookie: aliceCookie });
      assert.strictEqual(autoProjRes.status, 200);

      const dupRes = await httpRequest(testPort, 'POST', '/api/projects/' + projA.id + '/duplicate', {}, { Cookie: aliceCookie });
      assert.strictEqual(dupRes.status, 201);
      const projACopy = JSON.parse(dupRes.body.toString()).project;
      assert(projACopy.title.includes('(Copy)'));

      const delCopyRes = await httpRequest(testPort, 'DELETE', '/api/projects/' + projACopy.id, null, { Cookie: aliceCookie });
      assert.strictEqual(delCopyRes.status, 200);

      // 3. Per-user project isolation: signup a third active user (after switching defaultUserRole to user or approving via Alice) and confirm zero access to Alice's projects
      await httpRequest(testPort, 'PUT', '/api/admin/auth-config', { defaultUserRole: 'user' }, { Cookie: aliceCookie });
      const carolSignup = await httpRequest(testPort, 'POST', '/api/auth/signup', {
        name: 'Carol Author',
        email: 'carol@lab.local',
        username: 'carolauthor',
        password: 'CarolPassword!99'
      });
      assert.strictEqual(carolSignup.status, 201);
      const carolCookie = carolSignup.headers['set-cookie'].map((c) => c.split(';')[0]).join('; ');

      const carolList = JSON.parse((await httpRequest(testPort, 'GET', '/api/projects', null, { Cookie: carolCookie })).body.toString());
      assert.strictEqual(carolList.projects.length, 0, 'Carol must not see Alice projects');
      const carolFetchAlice = await httpRequest(testPort, 'GET', '/api/projects/' + projA.id, null, { Cookie: carolCookie });
      assert.strictEqual(carolFetchAlice.status, 404);

      // 4. Server JSON error handler returns clean JSON (never HTML <!DOCTYPE>) on malformed JSON / payload error
      const badJsonRes = await httpRequest(testPort, 'POST', '/api/sessions/save', '{bad json', {
        Cookie: aliceCookie,
        'Content-Type': 'application/json'
      });
      assert.strictEqual(badJsonRes.status, 400);
      assert(String(badJsonRes.headers['content-type'] || '').includes('application/json'), 'Malformed JSON error must return application/json');
      const badJsonBody = JSON.parse(badJsonRes.body.toString());
      assert.strictEqual(badJsonBody.ok, false);
    });
  } finally {
    serverProc.kill();
    fs.rmSync(tmpDataDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
