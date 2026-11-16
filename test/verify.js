const assert = require('assert');
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
    assert.strictEqual(catalog.length, 21);

    const indexHtml = fs.readFileSync(path.join(rootDir, 'public', 'index.html'), 'utf8');
    const stylesCss = fs.readFileSync(path.join(rootDir, 'public', 'styles.css'), 'utf8');
    assert(!/https?:\/\//i.test(indexHtml), 'index.html must not reference external CDNs');
    assert(!/https?:\/\//i.test(stylesCss), 'styles.css must not reference external URLs');
  });

  await check('4c. v0.2.1-beta UX: Startup Guide Checkbox, Full Undo/Redo & Scroll-Preserving Preview', () => {
    const indexHtml = fs.readFileSync(path.join(rootDir, 'public', 'index.html'), 'utf8');
    const appJs = fs.readFileSync(path.join(rootDir, 'public', 'app.js'), 'utf8');

    assert(indexHtml.includes('v0.2.1-beta'), 'index.html badge should display v0.2.1-beta');
    assert(indexHtml.includes('id="btnUndo"'), 'index.html should contain Undo button');
    assert(indexHtml.includes('id="btnRedo"'), 'index.html should contain Redo button');
    assert(indexHtml.includes('id="chkHideGuideStartup"'), 'index.html should contain startup guide opt-out checkbox');

    assert(!/https?:\/\//i.test(appJs), 'app.js must not reference external URLs');
    assert(appJs.includes('vlp_hide_guide_on_startup'), 'app.js should persist startup guide preference in localStorage');
    assert(appJs.includes('function performRedo()'), 'app.js should define performRedo()');
    assert(appJs.includes('function armTypingUndo('), 'app.js should define armTypingUndo()');
    assert(appJs.includes('doc.body.innerHTML = previewHtmlSnippet'), 'app.js should update preview iframe DOM in-place to preserve scroll');
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
      assert.strictEqual(JSON.parse(h.body.toString()).ok, true);

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
  } finally {
    serverProc.kill();
    fs.rmSync(tmpDataDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
