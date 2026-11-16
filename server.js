const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const JSZip = require('jszip');
const VLPFormatter = require('./public/vlp-formatter.js');

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, 'data');
const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');
const IMAGES_DIR = path.join(DATA_DIR, 'images');
const AUTOSAVE_FILE = path.join(SESSIONS_DIR, 'autosave.json');

fs.mkdirSync(SESSIONS_DIR, { recursive: true });
fs.mkdirSync(IMAGES_DIR, { recursive: true });

app.use(express.json({ limit: '64mb' }));
app.use(express.raw({ type: ['application/zip', 'application/octet-stream'], limit: '100mb' }));

// Static application & bundled offline assets (zero CDNs)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/samples/annexb/images', express.static(path.join(__dirname, 'dsac.annexb.lab01-en', 'images')));
app.use('/samples/annexc/images', express.static(path.join(__dirname, 'dsac.annexc.lab01-en', 'images')));

function sanitizeId(input) {
  const cleaned = String(input || '').replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '');
  return cleaned || ('session-' + Date.now());
}

function sanitizeFilename(input) {
  const base = path.basename(String(input || '').trim());
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!cleaned || cleaned === '.' || cleaned === '..') {
    return crypto.randomUUID() + '.png';
  }
  return cleaned;
}

function atomicWriteJson(filePath, data) {
  const tmpPath = filePath + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, filePath);
}

function readJsonSafe(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return null;
  }
}

function countContentNodes(nodes) {
  let count = 0;
  (nodes || []).forEach(function (n) {
    count += 1 + countContentNodes(n.children || []);
  });
  return count;
}

function guessMimeType(filename) {
  const ext = path.extname(String(filename || '')).toLowerCase();
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.webp': return 'image/webp';
    case '.svg': return 'image/svg+xml';
    default: return 'application/octet-stream';
  }
}

function decodeDataUrl(dataUrl) {
  const m = String(dataUrl || '').match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (!m) return null;
  return {
    mimeType: m[1],
    buffer: Buffer.from(m[2], 'base64')
  };
}

function listDirFilesSafe(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(function (f) {
    const full = path.join(dir, f);
    return fs.statSync(full).isFile();
  });
}

// Health check
app.get('/api/health', function (_req, res) {
  res.json({
    ok: true,
    port: PORT,
    dataDir: DATA_DIR,
    airGapped: true,
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// Sample reference manuals (Annex B & Annex C)
app.get('/api/samples/:name', function (req, res) {
  const name = String(req.params.name || '').toLowerCase();
  let folderName = null;
  let samplePrefix = null;
  if (name === 'annexb') {
    folderName = 'dsac.annexb.lab01-en';
    samplePrefix = '/samples/annexb/images';
  } else if (name === 'annexc') {
    folderName = 'dsac.annexc.lab01-en';
    samplePrefix = '/samples/annexc/images';
  } else {
    return res.status(404).json({ ok: false, error: 'Unknown sample manual: ' + name });
  }

  const xmlPath = path.join(__dirname, folderName, 'content.xml');
  if (!fs.existsSync(xmlPath)) {
    return res.status(404).json({ ok: false, error: 'Sample content.xml not found' });
  }

  try {
    const xmlStr = fs.readFileSync(xmlPath, 'utf8');
    const manual = VLPFormatter.parseXmlToManual(xmlStr);
    const imgFiles = listDirFilesSafe(path.join(__dirname, folderName, 'images'));
    const imageMap = {};
    imgFiles.forEach(function (fn) {
      imageMap[fn] = {
        filename: fn,
        src: './images/' + fn,
        previewUrl: samplePrefix + '/' + fn
      };
    });
    res.json({
      ok: true,
      sampleKey: name,
      samplePrefix: samplePrefix,
      manual: manual,
      imageMap: imageMap
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Autosave session endpoints
app.get('/api/sessions/autosave', function (_req, res) {
  const saved = readJsonSafe(AUTOSAVE_FILE);
  if (!saved) {
    return res.json({ ok: true, exists: false });
  }
  res.json({ ok: true, exists: true, session: saved });
});

app.post('/api/sessions/autosave', function (req, res) {
  try {
    const payload = req.body || {};
    const record = {
      id: 'autosave',
      name: payload.sessionName || (payload.manual && payload.manual.name) || 'Autosave',
      updatedAt: new Date().toISOString(),
      state: payload
    };
    atomicWriteJson(AUTOSAVE_FILE, record);
    res.json({ ok: true, updatedAt: record.updatedAt });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Named session snapshots
app.get('/api/sessions', function (_req, res) {
  try {
    const files = listDirFilesSafe(SESSIONS_DIR).filter(function (f) {
      return f.endsWith('.json') && f !== 'autosave.json' && !f.endsWith('.tmp');
    });
    const list = files
      .map(function (f) {
        const doc = readJsonSafe(path.join(SESSIONS_DIR, f));
        if (!doc) return null;
        const manual = (doc.state && doc.state.manual) || {};
        return {
          id: doc.id || f.replace(/\.json$/, ''),
          name: doc.name || manual.name || 'Untitled Snapshot',
          manualName: manual.name || '',
          nodeCount: countContentNodes(manual.contentNodes || []),
          updatedAt: doc.updatedAt || ''
        };
      })
      .filter(Boolean)
      .sort(function (a, b) {
        return String(b.updatedAt).localeCompare(String(a.updatedAt));
      });
    res.json({ ok: true, sessions: list });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/sessions/save', function (req, res) {
  try {
    const body = req.body || {};
    const id = sanitizeId(body.id || ('snap-' + Date.now()));
    const state = body.state || {};
    const name = String(body.name || (state.manual && state.manual.name) || 'Snapshot').trim();
    const record = {
      id: id,
      name: name,
      updatedAt: new Date().toISOString(),
      state: state
    };
    atomicWriteJson(path.join(SESSIONS_DIR, id + '.json'), record);
    res.json({ ok: true, id: id, name: name, updatedAt: record.updatedAt });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/sessions/:id', function (req, res) {
  const id = sanitizeId(req.params.id);
  const filePath = path.join(SESSIONS_DIR, id + '.json');
  const doc = readJsonSafe(filePath);
  if (!doc) {
    return res.status(404).json({ ok: false, error: 'Session snapshot not found' });
  }
  res.json({ ok: true, session: doc });
});

app.delete('/api/sessions/:id', function (req, res) {
  const id = sanitizeId(req.params.id);
  if (id === 'autosave') {
    return res.status(400).json({ ok: false, error: 'Cannot delete autosave slot directly' });
  }
  const filePath = path.join(SESSIONS_DIR, id + '.json');
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  res.json({ ok: true });
});

// Persistent image upload & retrieval
app.post('/api/images', function (req, res) {
  try {
    const body = req.body || {};
    const filename = sanitizeFilename(body.filename || (crypto.randomUUID() + '.png'));
    let buf = null;

    if (body.dataUrl) {
      const decoded = decodeDataUrl(body.dataUrl);
      if (!decoded) {
        return res.status(400).json({ ok: false, error: 'Invalid dataUrl' });
      }
      buf = decoded.buffer;
    } else if (body.base64) {
      buf = Buffer.from(String(body.base64), 'base64');
    } else {
      return res.status(400).json({ ok: false, error: 'Missing image payload' });
    }

    const outPath = path.join(IMAGES_DIR, filename);
    fs.writeFileSync(outPath, buf);
    res.json({
      ok: true,
      filename: filename,
      src: './images/' + filename,
      previewUrl: '/api/images/' + encodeURIComponent(filename)
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/images/:filename', function (req, res) {
  const filename = sanitizeFilename(req.params.filename);
  const filePath = path.join(IMAGES_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Image not found');
  }
  res.type(guessMimeType(filename));
  res.sendFile(filePath);
});

// Locate image bytes from request payload, /data/images, bundled assets, or sample manuals
function resolveImageBufferForZip(filename, imagesMeta, sampleSource) {
  const cleanName = sanitizeFilename(filename);
  const metaEntry = (imagesMeta && (imagesMeta[cleanName] || imagesMeta['./images/' + cleanName])) || null;
  if (metaEntry && metaEntry.dataUrl) {
    const decoded = decodeDataUrl(metaEntry.dataUrl);
    if (decoded) return decoded.buffer;
  }

  const diskPath = path.join(IMAGES_DIR, cleanName);
  if (fs.existsSync(diskPath)) {
    return fs.readFileSync(diskPath);
  }

  const sampleDirs = [];
  if (sampleSource === 'annexb') {
    sampleDirs.push(path.join(__dirname, 'dsac.annexb.lab01-en', 'images'));
    sampleDirs.push(path.join(__dirname, 'dsac.annexc.lab01-en', 'images'));
  } else if (sampleSource === 'annexc') {
    sampleDirs.push(path.join(__dirname, 'dsac.annexc.lab01-en', 'images'));
    sampleDirs.push(path.join(__dirname, 'dsac.annexb.lab01-en', 'images'));
  } else {
    sampleDirs.push(path.join(__dirname, 'dsac.annexb.lab01-en', 'images'));
    sampleDirs.push(path.join(__dirname, 'dsac.annexc.lab01-en', 'images'));
  }
  sampleDirs.push(path.join(__dirname, 'public', 'assets'));

  for (let i = 0; i < sampleDirs.length; i++) {
    const candidate = path.join(sampleDirs[i], cleanName);
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate);
    }
  }
  return null;
}

// Export VLP Manual Package (.zip with content.xml + images/)
app.post('/api/export-zip', async function (req, res) {
  try {
    const body = req.body || {};
    const manual = body.manual;
    if (!manual || !Array.isArray(manual.contentNodes)) {
      return res.status(400).json({ ok: false, error: 'Missing manual payload' });
    }
    const imagesMeta = body.imagesMeta || {};
    const sampleSource = body.sampleSource || '';
    const lang = manual.defaultLanguageCode || 'en';
    const baseName = sanitizeId(manual.name || 'vlp.manual');
    const folderName = baseName.endsWith('-' + lang) ? baseName : (baseName + '-' + lang);

    const xmlContent = VLPFormatter.serializeManualToXml(manual, imagesMeta);

    const zip = new JSZip();
    const rootFolder = zip.folder(folderName);
    rootFolder.file('content.xml', xmlContent);

    // Collect every ./images/<file> and ./assets/<file> referenced in generated HTML
    const referencedFiles = new Set();
    function walkCollectImages(nodes) {
      (nodes || []).forEach(function (n) {
        const html = VLPFormatter.generateNodeHtml(n, { imageMode: 'vlp' });
        const re = /<img\b[^>]*\bsrc=["'](?:\.\/images\/|\.\/assets\/)([^"'?#]+)["']/gi;
        let m;
        while ((m = re.exec(html)) !== null) {
          referencedFiles.add(sanitizeFilename(m[1]));
        }
        (n.images || []).forEach(function (im) {
          if (im.filename) referencedFiles.add(sanitizeFilename(im.filename));
        });
        walkCollectImages(n.children || []);
      });
    }
    walkCollectImages(manual.contentNodes);

    if (referencedFiles.size > 0) {
      const imagesFolder = rootFolder.folder('images');
      referencedFiles.forEach(function (fn) {
        const buf = resolveImageBufferForZip(fn, imagesMeta, sampleSource);
        if (buf) {
          imagesFolder.file(fn, buf);
        }
      });
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="' + folderName + '.zip"');
    res.send(zipBuffer);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Import VLP Manual Package (.zip or raw XML)
app.post('/api/import-zip', async function (req, res) {
  try {
    let zipBuf = null;
    if (Buffer.isBuffer(req.body)) {
      zipBuf = req.body;
    } else if (req.body && req.body.zipBase64) {
      const cleaned = String(req.body.zipBase64).replace(/^data:[^;]+;base64,/, '');
      zipBuf = Buffer.from(cleaned, 'base64');
    } else {
      return res.status(400).json({ ok: false, error: 'Missing zip payload' });
    }

    const zip = await JSZip.loadAsync(zipBuf);
    const entries = Object.keys(zip.files).filter(function (k) { return !zip.files[k].dir; });
    const xmlKey = entries.find(function (k) {
      return path.basename(k).toLowerCase() === 'content.xml';
    });
    if (!xmlKey) {
      return res.status(400).json({ ok: false, error: 'Archive does not contain content.xml' });
    }

    const xmlText = await zip.files[xmlKey].async('string');
    const manual = VLPFormatter.parseXmlToManual(xmlText);

    const imageMap = {};
    for (let i = 0; i < entries.length; i++) {
      const k = entries[i];
      if (!/\/images\/|\bimages\//i.test(k)) continue;
      const fn = sanitizeFilename(path.basename(k));
      const buf = await zip.files[k].async('nodebuffer');
      fs.writeFileSync(path.join(IMAGES_DIR, fn), buf);
      const mime = guessMimeType(fn);
      imageMap[fn] = {
        filename: fn,
        src: './images/' + fn,
        previewUrl: '/api/images/' + encodeURIComponent(fn),
        dataUrl: 'data:' + mime + ';base64,' + buf.toString('base64')
      };
    }

    res.json({ ok: true, manual: manual, imageMap: imageMap });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', function () {
  console.log('VLP Manual Generator listening on http://0.0.0.0:' + PORT);
  console.log('Persistent storage directory: ' + DATA_DIR);
});
