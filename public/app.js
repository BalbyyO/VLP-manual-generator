(function () {
  'use strict';

  const VLP = window.VLPFormatter;

  const HIDE_GUIDE_KEY = 'vlp_hide_guide_on_startup';
  const MAX_UNDO_HISTORY = 40;
  const TYPING_BURST_MS = 900;

  // =========================================================================
  // Application State
  // =========================================================================
  const state = {
    manual: null,
    activeNodeId: null,
    activeStepIndex: 0,
    imageMap: {},
    sampleSource: '',
    previewTheme: 'light', // 'light' | 'dark'
    outTab: 'preview',     // 'preview' | 'html' | 'xml'
    copyImageMode: 'vlp',  // 'vlp' | 'base64'
    undoStack: [],
    redoStack: [],
    hasPendingSave: false,
    lastFocusedEl: null,
    lastSelection: { start: 0, end: 0 }
  };

  let autosaveBrowserTimer = null;
  let autosaveServerTimer = null;
  let pendingStepFileTargetIdx = null;
  let toastTimer = null;
  let typingUndoTarget = null;
  let typingUndoTimer = null;
  let lastPreviewedNodeId = null;
  let previewDocInitialized = false;
  let previewScrollRafId = null;

  // =========================================================================
  // DOM Helpers
  // =========================================================================
  const $ = function (id) { return document.getElementById(id); };

  function showToast(msg, isError) {
    const el = $('toast');
    el.textContent = msg;
    el.className = 'toast show' + (isError ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.className = 'toast';
    }, 2600);
  }

  function setSaveStatus(statusType, text) {
    const badge = $('saveStatusBadge');
    const label = $('saveStatusText');
    badge.className = 'badge status-' + statusType;
    label.textContent = text;
  }

  function formatTime(date) {
    const d = date || new Date();
    return d.toTimeString().slice(0, 8);
  }

  // =========================================================================
  // IndexedDB Persistence (Browser Auto-Save)
  // =========================================================================
  const IDB_NAME = 'vlp-manual-generator-db';
  const IDB_STORE = 'sessions';

  function openIdb() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) return reject(new Error('IndexedDB unavailable'));
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = function (e) {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  async function idbSet(id, payload) {
    try {
      const db = await openIdb();
      return new Promise(function (resolve, reject) {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put({ id: id, updatedAt: payload.updatedAt, state: payload });
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { reject(tx.error); };
      });
    } catch (e) {
      try {
        localStorage.setItem('vlp_autosave_fallback', JSON.stringify(payload));
      } catch (_ignore) {}
      return false;
    }
  }

  async function idbGet(id) {
    try {
      const db = await openIdb();
      return new Promise(function (resolve) {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(id);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { resolve(null); };
      });
    } catch (e) {
      try {
        const raw = localStorage.getItem('vlp_autosave_fallback');
        return raw ? { id: id, state: JSON.parse(raw) } : null;
      } catch (_ignore) {
        return null;
      }
    }
  }

  function buildSerializableState() {
    return {
      manual: state.manual,
      activeNodeId: state.activeNodeId,
      imageMap: state.imageMap,
      sampleSource: state.sampleSource,
      previewTheme: state.previewTheme,
      copyImageMode: state.copyImageMode,
      updatedAt: new Date().toISOString()
    };
  }

  async function saveToServerNow(payload) {
    try {
      const res = await fetch('/api/sessions/autosave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Server save failed');
      state.hasPendingSave = false;
      setSaveStatus('ok', 'Saved (Browser & Disk) • ' + formatTime());
      return true;
    } catch (err) {
      state.hasPendingSave = false;
      setSaveStatus('warn', 'Saved (Browser Only) • ' + formatTime());
      return false;
    }
  }

  function scheduleAutosave() {
    state.hasPendingSave = true;
    setSaveStatus('saving', 'Saving...');
    clearTimeout(autosaveBrowserTimer);
    clearTimeout(autosaveServerTimer);

    autosaveBrowserTimer = setTimeout(async function () {
      const payload = buildSerializableState();
      await idbSet('autosave', payload);
    }, 250);

    autosaveServerTimer = setTimeout(async function () {
      const payload = buildSerializableState();
      await idbSet('autosave', payload);
      await saveToServerNow(payload);
    }, 1100);
  }

  function flushAutosaveBeacon() {
    if (!state.manual) return;
    const payload = buildSerializableState();
    try {
      localStorage.setItem('vlp_autosave_meta', JSON.stringify({ updatedAt: payload.updatedAt, name: state.manual.name }));
    } catch (_ignore) {}
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/sessions/autosave', blob);
    }
  }

  // =========================================================================
  // Tree Traversal & Undo History
  // =========================================================================
  function shouldHideGuideOnStartup() {
    try {
      return localStorage.getItem(HIDE_GUIDE_KEY) === 'true';
    } catch (_ignore) {
      return false;
    }
  }

  function syncStartupGuideCheckbox() {
    const chk = $('chkHideGuideStartup');
    if (chk) chk.checked = shouldHideGuideOnStartup();
  }

  function resetTypingBurst() {
    clearTimeout(typingUndoTimer);
    typingUndoTimer = null;
    typingUndoTarget = null;
  }

  function updateUndoRedoButtons() {
    const btnUndo = $('btnUndo');
    const btnRedo = $('btnRedo');
    if (btnUndo) btnUndo.disabled = state.undoStack.length === 0;
    if (btnRedo) btnRedo.disabled = state.redoStack.length === 0;
  }

  function captureSnapshot() {
    return {
      manual: JSON.parse(JSON.stringify(state.manual)),
      activeNodeId: state.activeNodeId,
      activeStepIndex: state.activeStepIndex,
      imageMap: JSON.parse(JSON.stringify(state.imageMap)),
      sampleSource: state.sampleSource
    };
  }

  function applySnapshot(snap) {
    state.manual = normalizeManualData(snap.manual);
    state.activeNodeId = snap.activeNodeId;
    state.activeStepIndex = typeof snap.activeStepIndex === 'number' ? snap.activeStepIndex : 0;
    state.imageMap = snap.imageMap || {};
    state.sampleSource = snap.sampleSource || '';
    applyColorTheme(state.manual.colorTheme);
    updateUndoRedoButtons();
    renderAll();
  }

  function isManualTextField(target) {
    if (!target) return false;
    if (target.id === 'manualNameInput' || target.id === 'manualLangInput') return true;
    if (target.id === 'quickPasteInput') return false;
    const editorBody = $('editorBody');
    if (!editorBody || !editorBody.contains(target)) return false;
    if (target.tagName === 'TEXTAREA') return !target.readOnly && !target.disabled;
    if (target.tagName === 'INPUT') {
      const t = (target.type || 'text').toLowerCase();
      return t !== 'checkbox' && t !== 'radio' && t !== 'file' && t !== 'button' && t !== 'submit' && t !== 'reset' && !target.readOnly && !target.disabled;
    }
    return false;
  }

  function armTypingUndo(target) {
    if (!state.manual || !target) return;
    if (typingUndoTarget !== target) {
      resetTypingBurst();
      pushUndo();
      typingUndoTarget = target;
    }
    clearTimeout(typingUndoTimer);
    typingUndoTimer = setTimeout(function () {
      typingUndoTarget = null;
      typingUndoTimer = null;
    }, TYPING_BURST_MS);
  }

  function pushUndo() {
    if (!state.manual) return;
    resetTypingBurst();
    state.undoStack.push(captureSnapshot());
    if (state.undoStack.length > MAX_UNDO_HISTORY) state.undoStack.shift();
    state.redoStack = [];
    updateUndoRedoButtons();
  }

  function performUndo() {
    if (state.undoStack.length === 0 || !state.manual) return;
    resetTypingBurst();
    state.redoStack.push(captureSnapshot());
    if (state.redoStack.length > MAX_UNDO_HISTORY) state.redoStack.shift();
    const snap = state.undoStack.pop();
    applySnapshot(snap);
    scheduleAutosave();
    showToast('Undid last change');
  }

  function performRedo() {
    if (state.redoStack.length === 0 || !state.manual) return;
    resetTypingBurst();
    state.undoStack.push(captureSnapshot());
    if (state.undoStack.length > MAX_UNDO_HISTORY) state.undoStack.shift();
    const snap = state.redoStack.pop();
    applySnapshot(snap);
    scheduleAutosave();
    showToast('Redid change');
  }

  function findNodeAndParent(nodes, targetId, parent) {
    for (let i = 0; i < (nodes || []).length; i++) {
      const n = nodes[i];
      if (n.id === targetId) return { node: n, parent: parent, siblings: nodes, index: i };
      const found = findNodeAndParent(n.children || [], targetId, n);
      if (found) return found;
    }
    return null;
  }

  function getActiveInfo() {
    if (!state.manual) return null;
    const info = findNodeAndParent(state.manual.contentNodes, state.activeNodeId, null);
    if (info) return info;
    if (state.manual.contentNodes.length > 0) {
      state.activeNodeId = state.manual.contentNodes[0].id;
      return {
        node: state.manual.contentNodes[0],
        parent: null,
        siblings: state.manual.contentNodes,
        index: 0
      };
    }
    return null;
  }

  function countNodes(nodes) {
    let total = 0;
    (nodes || []).forEach(function (n) {
      total += 1 + countNodes(n.children || []);
    });
    return total;
  }

  // =========================================================================
  // Starter Manual & Bundled Offline Assets
  // =========================================================================
  async function preloadBundledSvgAssets() {
    const assets = ['banner-sample.svg', 'step-sample.svg'];
    for (let i = 0; i < assets.length; i++) {
      const fn = assets[i];
      try {
        const res = await fetch('./assets/' + fn);
        if (!res.ok) continue;
        const svgText = await res.text();
        const b64 = btoa(unescape(encodeURIComponent(svgText)));
        state.imageMap[fn] = {
          filename: fn,
          src: './images/' + fn,
          previewUrl: './assets/' + fn,
          dataUrl: 'data:image/svg+xml;base64,' + b64
        };
      } catch (_ignore) {}
    }
  }

  function createStarterManual() {
    const templates = VLP.getTemplates();
    const overviewTpl = templates[0];
    const showcaseTpl = templates[3];
    const rootId = VLP.generateUuid();
    const chapId = VLP.generateUuid();
    const stepId = VLP.generateUuid();

    return {
      id: VLP.generateUuid(),
      name: 'vlp.lab01.starter',
      defaultLanguageCode: 'en',
      dataFormat: 'default',
      colorTheme: 'crimson-slate',
      contentNodes: [
        {
          id: rootId,
          title: 'Course Overview',
          orderIndex: 0,
          languageCode: 'en',
          mode: 'overview',
          overview: JSON.parse(JSON.stringify(overviewTpl.overview)),
          stepsData: VLP.createDefaultStepsData(),
          rawHtml: '',
          images: [],
          children: [
            {
              id: chapId,
              title: 'Module 1: Lab Setup',
              orderIndex: 0,
              languageCode: 'en',
              mode: 'overview',
              overview: JSON.parse(JSON.stringify(templates[1].overview)),
              stepsData: VLP.createDefaultStepsData(),
              rawHtml: '',
              images: [],
              children: [
                {
                  id: stepId,
                  title: 'All-Buttons Showcase',
                  orderIndex: 0,
                  languageCode: 'en',
                  mode: 'steps',
                  overview: VLP.createDefaultOverviewData(),
                  stepsData: JSON.parse(JSON.stringify(showcaseTpl.stepsData)),
                  rawHtml: '',
                  images: [],
                  children: []
                }
              ]
            }
          ]
        }
      ]
    };
  }

  function createBlankManual() {
    const rootId = VLP.generateUuid();
    const chapId = VLP.generateUuid();
    const stepId = VLP.generateUuid();
    return {
      id: VLP.generateUuid(),
      name: 'new.vlp.manual',
      defaultLanguageCode: 'en',
      dataFormat: 'default',
      colorTheme: 'crimson-slate',
      contentNodes: [
        {
          id: rootId,
          title: 'Course Overview',
          orderIndex: 0,
          languageCode: 'en',
          mode: 'overview',
          overview: VLP.createDefaultOverviewData(),
          stepsData: VLP.createDefaultStepsData(),
          rawHtml: '',
          images: [],
          children: [
            {
              id: chapId,
              title: 'Chapter 1',
              orderIndex: 0,
              languageCode: 'en',
              mode: 'overview',
              overview: VLP.createDefaultOverviewData(),
              stepsData: VLP.createDefaultStepsData(),
              rawHtml: '',
              images: [],
              children: [
                {
                  id: stepId,
                  title: 'Step 1',
                  orderIndex: 0,
                  languageCode: 'en',
                  mode: 'steps',
                  overview: VLP.createDefaultOverviewData(),
                  stepsData: VLP.createDefaultStepsData(),
                  rawHtml: '',
                  images: [],
                  children: []
                }
              ]
            }
          ]
        }
      ]
    };
  }

  // =========================================================================
  // Image Handling (Upload, Clipboard Paste, Drag-Drop, Measurements)
  // =========================================================================
  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(reader.error); };
      reader.readAsDataURL(file);
    });
  }

  function measureImageDimensions(dataUrl) {
    return new Promise(function (resolve) {
      const img = new Image();
      img.onload = function () {
        resolve({ width: img.naturalWidth || '', height: img.naturalHeight || '' });
      };
      img.onerror = function () {
        resolve({ width: '', height: '' });
      };
      img.src = dataUrl;
    });
  }

  async function ingestImageFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please select a valid image file', true);
      return null;
    }
    const extMap = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg'
    };
    const ext = extMap[file.type] || 'png';
    const filename = VLP.generateUuid() + '.' + ext;
    const dataUrl = await readFileAsDataUrl(file);
    const dims = await measureImageDimensions(dataUrl);

    let previewUrl = dataUrl;
    try {
      const res = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: filename, dataUrl: dataUrl })
      });
      if (res.ok) {
        const json = await res.json();
        previewUrl = json.previewUrl || dataUrl;
      }
    } catch (_ignore) {}

    const entry = {
      filename: filename,
      src: './images/' + filename,
      previewUrl: previewUrl,
      dataUrl: dataUrl,
      width: dims.width ? String(dims.width) : '',
      height: dims.height ? String(dims.height) : ''
    };
    state.imageMap[filename] = entry;
    state.imageMap[entry.src] = entry;
    return entry;
  }

  function bindDropzone(el, onImageEntries) {
    if (!el) return;
    el.addEventListener('dragover', function (e) {
      e.preventDefault();
      el.classList.add('dragover');
    });
    el.addEventListener('dragleave', function () {
      el.classList.remove('dragover');
    });
    el.addEventListener('drop', async function (e) {
      e.preventDefault();
      el.classList.remove('dragover');
      const files = Array.from(e.dataTransfer.files || []).filter(function (f) { return f.type.startsWith('image/'); });
      const results = [];
      for (let i = 0; i < files.length; i++) {
        const entry = await ingestImageFile(files[i]);
        if (entry) results.push(entry);
      }
      if (results.length) onImageEntries(results);
    });
    el.addEventListener('paste', async function (e) {
      const items = Array.from((e.clipboardData && e.clipboardData.items) || []);
      const imgItems = items.filter(function (it) { return it.type && it.type.startsWith('image/'); });
      if (!imgItems.length) return;
      e.preventDefault();
      const results = [];
      for (let i = 0; i < imgItems.length; i++) {
        const file = imgItems[i].getAsFile();
        const entry = await ingestImageFile(file);
        if (entry) results.push(entry);
      }
      if (results.length) onImageEntries(results);
    });
  }

  // =========================================================================
  // Rendering: Tree Sidebar
  // =========================================================================
  function renderTree() {
    $('manualNameInput').value = state.manual.name || '';
    $('manualLangInput').value = state.manual.defaultLanguageCode || 'en';
    const total = countNodes(state.manual.contentNodes);
    $('nodeCountLabel').textContent = total + (total === 1 ? ' node' : ' nodes');

    const treeList = $('treeList');
    treeList.innerHTML = '';

    function appendNodes(nodes, level) {
      (nodes || []).forEach(function (node, idx) {
        const row = document.createElement('div');
        row.className = 'tree-node level-' + Math.min(level, 2) + (node.id === state.activeNodeId ? ' active' : '');
        row.setAttribute('role', 'treeitem');
        row.title = node.title;

        const main = document.createElement('div');
        main.className = 'tree-node-main';

        const pill = document.createElement('span');
        pill.className = 'mode-pill ' + node.mode;
        pill.textContent = node.mode === 'overview' ? 'OVR' : (node.mode === 'steps' ? 'STP' : 'RAW');

        const titleSpan = document.createElement('span');
        titleSpan.className = 'tree-node-title';
        titleSpan.textContent = node.title || 'Untitled';

        main.appendChild(pill);
        main.appendChild(titleSpan);
        row.appendChild(main);

        const actions = document.createElement('div');
        actions.className = 'tree-node-actions';

        const upBtn = document.createElement('button');
        upBtn.type = 'button';
        upBtn.className = 'btn btn-xs btn-icon';
        upBtn.textContent = '↑';
        upBtn.title = 'Move Up';
        upBtn.disabled = idx === 0;
        upBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          moveNode(node.id, -1);
        });

        const downBtn = document.createElement('button');
        downBtn.type = 'button';
        downBtn.className = 'btn btn-xs btn-icon';
        downBtn.textContent = '↓';
        downBtn.title = 'Move Down';
        downBtn.disabled = idx === nodes.length - 1;
        downBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          moveNode(node.id, 1);
        });

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn btn-xs btn-icon';
        delBtn.textContent = '×';
        delBtn.title = 'Delete Node';
        delBtn.disabled = level === 0 && state.manual.contentNodes.length <= 1;
        delBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          deleteNode(node.id);
        });

        actions.appendChild(upBtn);
        actions.appendChild(downBtn);
        actions.appendChild(delBtn);
        row.appendChild(actions);

        row.addEventListener('click', function () {
          state.activeNodeId = node.id;
          state.activeStepIndex = 0;
          renderAll();
        });

        treeList.appendChild(row);
        if (node.children && node.children.length > 0) {
          appendNodes(node.children, level + 1);
        }
      });
    }

    appendNodes(state.manual.contentNodes, 0);
  }

  function addChapterNode() {
    pushUndo();
    const newChap = {
      id: VLP.generateUuid(),
      title: 'New Chapter',
      orderIndex: 0,
      languageCode: state.manual.defaultLanguageCode || 'en',
      mode: 'overview',
      overview: VLP.createDefaultOverviewData(),
      stepsData: VLP.createDefaultStepsData(),
      rawHtml: '',
      images: [],
      children: []
    };
    if (state.manual.contentNodes.length === 0) {
      state.manual.contentNodes.push(newChap);
    } else {
      const root = state.manual.contentNodes[0];
      root.children = root.children || [];
      root.children.push(newChap);
    }
    state.activeNodeId = newChap.id;
    renderAll();
    scheduleAutosave();
    showToast('Added new chapter');
  }

  function addStepPageNode() {
    pushUndo();
    const info = getActiveInfo();
    const newPage = {
      id: VLP.generateUuid(),
      title: 'Step 1',
      orderIndex: 0,
      languageCode: state.manual.defaultLanguageCode || 'en',
      mode: 'steps',
      overview: VLP.createDefaultOverviewData(),
      stepsData: VLP.createDefaultStepsData(),
      rawHtml: '',
      images: [],
      children: []
    };

    if (!info) {
      state.manual.contentNodes.push(newPage);
    } else if (info.parent && info.parent.parent) {
      // Currently at Level 2 -> add sibling under same Chapter
      info.siblings.push(newPage);
      newPage.title = 'Step ' + info.siblings.length;
    } else if (info.parent) {
      // Currently at Level 1 Chapter -> add under this Chapter
      info.node.children = info.node.children || [];
      info.node.children.push(newPage);
      newPage.title = 'Step ' + info.node.children.length;
    } else {
      // At Root Level 0 -> add under first Chapter or create Chapter
      info.node.children = info.node.children || [];
      if (info.node.children.length === 0) {
        const chap = {
          id: VLP.generateUuid(),
          title: 'Chapter 1',
          orderIndex: 0,
          languageCode: state.manual.defaultLanguageCode || 'en',
          mode: 'overview',
          overview: VLP.createDefaultOverviewData(),
          stepsData: VLP.createDefaultStepsData(),
          rawHtml: '',
          images: [],
          children: [newPage]
        };
        info.node.children.push(chap);
      } else {
        const targetChap = info.node.children[info.node.children.length - 1];
        targetChap.children = targetChap.children || [];
        targetChap.children.push(newPage);
        newPage.title = 'Step ' + targetChap.children.length;
      }
    }

    state.activeNodeId = newPage.id;
    renderAll();
    scheduleAutosave();
    showToast('Added procedural step page');
  }

  function moveNode(nodeId, delta) {
    const info = findNodeAndParent(state.manual.contentNodes, nodeId, null);
    if (!info) return;
    const targetIdx = info.index + delta;
    if (targetIdx < 0 || targetIdx >= info.siblings.length) return;
    pushUndo();
    const item = info.siblings.splice(info.index, 1)[0];
    info.siblings.splice(targetIdx, 0, item);
    renderAll();
    scheduleAutosave();
  }

  function deleteNode(nodeId) {
    const info = findNodeAndParent(state.manual.contentNodes, nodeId, null);
    if (!info) return;
    if (!info.parent && info.siblings.length <= 1) {
      showToast('Cannot delete the only root node', true);
      return;
    }
    pushUndo();
    info.siblings.splice(info.index, 1);
    if (state.activeNodeId === nodeId) {
      const next = info.siblings[info.index] || info.siblings[info.index - 1] || info.parent || state.manual.contentNodes[0];
      state.activeNodeId = next ? next.id : null;
    }
    renderAll();
    scheduleAutosave();
    showToast('Node removed (Undo available)');
  }

  // =========================================================================
  // Color Themes, Shared Credentials & Table Grid Builders
  // =========================================================================
  function populateColorThemeDropdown() {
    const sel = $('colorThemeSelect');
    if (!sel) return;
    sel.innerHTML = '';
    VLP.getColorThemes().forEach(function (t) {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      sel.appendChild(opt);
    });
  }

  function applyColorTheme(themeId) {
    const t = VLP.getColorTheme(themeId || (state.manual && state.manual.colorTheme) || 'crimson-slate');
    if (state.manual) {
      state.manual.colorTheme = t.id;
    }
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--app-accent', t.light.accent);
    rootStyle.setProperty('--app-accent-hover', t.light.accentHover);
    rootStyle.setProperty('--app-accent-soft', t.light.appSoft);

    const swatch = $('colorThemeSwatch');
    if (swatch) swatch.style.background = t.swatch;
    const sel = $('colorThemeSelect');
    if (sel) sel.value = t.id;
  }

  function normalizeManualData(manual) {
    if (!manual) return manual;
    if (!manual.colorTheme) manual.colorTheme = 'crimson-slate';
    function walk(nodes) {
      (nodes || []).forEach(function (n) {
        n.overview = Object.assign(VLP.createDefaultOverviewData(), n.overview || {});
        n.overview.credentialsList = VLP.normalizeCredentialsList(n.overview);
        if (!Array.isArray(n.overview.tables)) n.overview.tables = [];

        n.stepsData = Object.assign(VLP.createDefaultStepsData(), n.stepsData || {});
        n.stepsData.credentialsList = VLP.normalizeCredentialsList(n.stepsData);
        if (!Array.isArray(n.stepsData.tables)) n.stepsData.tables = [];
        n.stepsData.steps = (n.stepsData.steps || []).map(VLP.migrateStepData);
        walk(n.children || []);
      });
    }
    walk(manual.contentNodes || []);
    return manual;
  }

  function renderCredentialsEditor(containerEl, listRef, onMutate) {
    if (!containerEl) return;
    containerEl.innerHTML = '';
    if (!listRef || listRef.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'muted-hint';
      empty.textContent = 'No VM systems added yet. Click "+ Add VM System" to add one or more target machines.';
      containerEl.appendChild(empty);
      return;
    }

    listRef.forEach(function (entry, idx) {
      const card = document.createElement('div');
      card.className = 'cred-entry-card';

      const hdr = document.createElement('div');
      hdr.className = 'cred-entry-header';
      hdr.innerHTML = '<span>VM System #' + (idx + 1) + '</span>';
      const delBtn = makeTinyBtn('Remove', function () {
        pushUndo();
        listRef.splice(idx, 1);
        renderCredentialsEditor(containerEl, listRef, onMutate);
        onMutate();
      });
      hdr.appendChild(delBtn);
      card.appendChild(hdr);

      const g2 = document.createElement('div');
      g2.className = 'grid-2';

      const sysWrap = document.createElement('div');
      sysWrap.innerHTML = '<label class="field-label">Target System (.ui-target)</label>';
      const sysIn = document.createElement('input');
      sysIn.className = 'input';
      sysIn.type = 'text';
      sysIn.placeholder = 'e.g. NDSACDC01';
      sysIn.value = entry.targetSystem || '';
      sysIn.addEventListener('input', function () { entry.targetSystem = sysIn.value; onMutate(); });
      sysWrap.appendChild(sysIn);

      const noteWrap = document.createElement('div');
      noteWrap.innerHTML = '<label class="field-label">Role / IP Note (optional)</label>';
      const noteIn = document.createElement('input');
      noteIn.className = 'input';
      noteIn.type = 'text';
      noteIn.placeholder = 'e.g. 192.168.40.2 (Primary DC)';
      noteIn.dataset.trackSelection = 'true';
      noteIn.value = entry.note || '';
      noteIn.addEventListener('input', function () { entry.note = noteIn.value; onMutate(); });
      noteWrap.appendChild(noteIn);

      g2.appendChild(sysWrap);
      g2.appendChild(noteWrap);
      card.appendChild(g2);

      const g2b = document.createElement('div');
      g2b.className = 'grid-2';
      g2b.style.marginTop = '6px';

      const usrWrap = document.createElement('div');
      usrWrap.innerHTML = '<label class="field-label">Username (.cmd-inline)</label>';
      const usrIn = document.createElement('input');
      usrIn.className = 'input';
      usrIn.type = 'text';
      usrIn.placeholder = 'e.g. xadministrator';
      usrIn.value = entry.username || '';
      usrIn.addEventListener('input', function () { entry.username = usrIn.value; onMutate(); });
      usrWrap.appendChild(usrIn);

      const pwdWrap = document.createElement('div');
      pwdWrap.innerHTML = '<label class="field-label">Password (.cmd-inline)</label>';
      const pwdIn = document.createElement('input');
      pwdIn.className = 'input';
      pwdIn.type = 'text';
      pwdIn.placeholder = 'e.g. M@rines1M@rines1';
      pwdIn.value = entry.password || '';
      pwdIn.addEventListener('input', function () { entry.password = pwdIn.value; onMutate(); });
      pwdWrap.appendChild(pwdIn);

      g2b.appendChild(usrWrap);
      g2b.appendChild(pwdWrap);
      card.appendChild(g2b);

      containerEl.appendChild(card);
    });
  }

  function renderTablesEditor(containerEl, tablesRef, onMutate) {
    if (!containerEl) return;
    containerEl.innerHTML = '';
    if (!tablesRef || tablesRef.length === 0) return;

    tablesRef.forEach(function (tbl, tIdx) {
      if (!Array.isArray(tbl.rows) || tbl.rows.length === 0) {
        tbl.rows = [['Column 1', 'Column 2'], ['', '']];
      }
      const card = document.createElement('div');
      card.className = 'tbl-builder-card';

      const ctrlBar = document.createElement('div');
      ctrlBar.className = 'tbl-controls-bar';

      const left = document.createElement('div');
      left.style.display = 'flex';
      left.style.alignItems = 'center';
      left.style.gap = '8px';
      left.style.flex = '1';

      const titleIn = document.createElement('input');
      titleIn.className = 'input';
      titleIn.type = 'text';
      titleIn.style.maxWidth = '230px';
      titleIn.placeholder = 'Table Title (optional, e.g. NDSACESXI01)';
      titleIn.dataset.trackSelection = 'true';
      titleIn.value = tbl.title || '';
      titleIn.addEventListener('input', function () {
        tbl.title = titleIn.value;
        onMutate();
      });

      const hdrLbl = document.createElement('label');
      hdrLbl.style.display = 'inline-flex';
      hdrLbl.style.alignItems = 'center';
      hdrLbl.style.gap = '4px';
      hdrLbl.style.fontSize = '11.5px';
      hdrLbl.style.cursor = 'pointer';
      const hdrChk = document.createElement('input');
      hdrChk.type = 'checkbox';
      hdrChk.checked = tbl.hasHeader !== false;
      hdrChk.addEventListener('change', function () {
        pushUndo();
        tbl.hasHeader = hdrChk.checked;
        renderTablesEditor(containerEl, tablesRef, onMutate);
        onMutate();
      });
      hdrLbl.appendChild(hdrChk);
      hdrLbl.appendChild(document.createTextNode('Header Row'));

      left.appendChild(titleIn);
      left.appendChild(hdrLbl);

      const right = document.createElement('div');
      right.style.display = 'flex';
      right.style.gap = '4px';
      right.style.flexWrap = 'wrap';

      const addRowBtn = makeTinyBtn('+ Row', function () {
        pushUndo();
        const cols = tbl.rows[0] ? tbl.rows[0].length : 2;
        tbl.rows.push(new Array(cols).fill(''));
        renderTablesEditor(containerEl, tablesRef, onMutate);
        onMutate();
      });
      const delRowBtn = makeTinyBtn('- Row', function () {
        if (tbl.rows.length > 1) {
          pushUndo();
          tbl.rows.pop();
          renderTablesEditor(containerEl, tablesRef, onMutate);
          onMutate();
        }
      });
      const addColBtn = makeTinyBtn('+ Col', function () {
        pushUndo();
        tbl.rows.forEach(function (r, rIdx) {
          r.push(rIdx === 0 && tbl.hasHeader !== false ? 'Column ' + (r.length + 1) : '');
        });
        renderTablesEditor(containerEl, tablesRef, onMutate);
        onMutate();
      });
      const delColBtn = makeTinyBtn('- Col', function () {
        if (tbl.rows[0] && tbl.rows[0].length > 1) {
          pushUndo();
          tbl.rows.forEach(function (r) { r.pop(); });
          renderTablesEditor(containerEl, tablesRef, onMutate);
          onMutate();
        }
      });
      const rmTblBtn = makeTinyBtn('Delete Table', function () {
        pushUndo();
        tablesRef.splice(tIdx, 1);
        renderTablesEditor(containerEl, tablesRef, onMutate);
        onMutate();
      });

      right.appendChild(addRowBtn);
      right.appendChild(delRowBtn);
      right.appendChild(addColBtn);
      right.appendChild(delColBtn);
      right.appendChild(rmTblBtn);

      ctrlBar.appendChild(left);
      ctrlBar.appendChild(right);
      card.appendChild(ctrlBar);

      const wrap = document.createElement('div');
      wrap.className = 'tbl-grid-wrap';
      const tableEl = document.createElement('table');
      tableEl.className = 'tbl-grid';

      const useHdr = tbl.hasHeader !== false && tbl.rows.length > 1;
      if (useHdr) {
        const thead = document.createElement('thead');
        const tr = document.createElement('tr');
        tbl.rows[0].forEach(function (cellVal, cIdx) {
          const th = document.createElement('th');
          const inp = document.createElement('input');
          inp.type = 'text';
          inp.className = 'tbl-cell-input';
          inp.style.fontWeight = '700';
          inp.dataset.trackSelection = 'true';
          inp.value = cellVal || '';
          inp.placeholder = 'Header ' + (cIdx + 1);
          inp.addEventListener('input', function () {
            tbl.rows[0][cIdx] = inp.value;
            onMutate();
          });
          th.appendChild(inp);
          tr.appendChild(th);
        });
        thead.appendChild(tr);
        tableEl.appendChild(thead);
      }

      const tbody = document.createElement('tbody');
      const startRow = useHdr ? 1 : 0;
      for (let rIdx = startRow; rIdx < tbl.rows.length; rIdx++) {
        const tr = document.createElement('tr');
        tbl.rows[rIdx].forEach(function (cellVal, cIdx) {
          const td = document.createElement('td');
          const inp = document.createElement('input');
          inp.type = 'text';
          inp.className = 'tbl-cell-input';
          inp.dataset.trackSelection = 'true';
          inp.value = cellVal || '';
          inp.placeholder = 'Value';
          inp.addEventListener('input', function () {
            tbl.rows[rIdx][cIdx] = inp.value;
            onMutate();
          });
          td.appendChild(inp);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      }
      tableEl.appendChild(tbody);
      wrap.appendChild(tableEl);
      card.appendChild(wrap);
      containerEl.appendChild(card);
    });
  }

  // =========================================================================
  // Rendering: Editor Pane
  // =========================================================================
  function renderEditor() {
    const info = getActiveInfo();
    if (!info) return;
    const node = info.node;

    $('nodeTitleInput').value = node.title || '';
    $('modeBtnOverview').classList.toggle('active', node.mode === 'overview');
    $('modeBtnSteps').classList.toggle('active', node.mode === 'steps');
    $('modeBtnRaw').classList.toggle('active', node.mode === 'raw');

    $('overviewToolbarGroup').classList.toggle('hidden', node.mode !== 'overview');
    $('stepsToolbarGroup').classList.toggle('hidden', node.mode !== 'steps');

    const childCount = (node.children || []).length;
    const showConsolidate = info.parent !== null && childCount > 0;
    $('chapterConsolidateBanner').classList.toggle('hidden', !showConsolidate);
    if (showConsolidate) {
      $('chapterChildCount').textContent = String(childCount);
    }

    $('overviewEditor').classList.toggle('hidden', node.mode !== 'overview');
    $('stepsEditor').classList.toggle('hidden', node.mode !== 'steps');
    $('rawEditor').classList.toggle('hidden', node.mode !== 'raw');

    if (node.mode === 'overview') {
      const ov = node.overview || (node.overview = VLP.createDefaultOverviewData());
      ov.credentialsList = VLP.normalizeCredentialsList(ov);
      if (!Array.isArray(ov.tables)) ov.tables = [];

      $('ovCourseTitle').value = ov.courseTitle || '';
      $('ovBannerAlt').value = ov.bannerAlt || '';
      $('ovBannerSrc').value = ov.bannerSrc || '';
      $('ovOverviewText').value = ov.overviewText || '';
      $('ovShowDivider').checked = ov.showDivider !== false;
      renderTablesEditor($('ovTablesContainer'), ov.tables, function () {
        updateOutputs();
        scheduleAutosave();
      });

      $('ovPurposeEnabled').checked = Boolean(ov.purposeEnabled);
      $('ovPurposeFields').classList.toggle('hidden', !ov.purposeEnabled);
      $('ovPurposeTitle').value = ov.purposeTitle || 'INSTRUCTIONAL PURPOSE';
      $('ovPurposeText').value = ov.purposeText || '';

      $('ovCredEnabled').checked = Boolean(ov.credentialsEnabled);
      $('ovCredFields').classList.toggle('hidden', !ov.credentialsEnabled);
      $('ovCredTitle').value = ov.credentialsTitle || 'Target VM Credentials';
      renderCredentialsEditor($('ovCredListContainer'), ov.credentialsList, function () {
        updateOutputs();
        scheduleAutosave();
      });
    } else if (node.mode === 'steps') {
      const stData = node.stepsData || (node.stepsData = VLP.createDefaultStepsData());
      stData.credentialsList = VLP.normalizeCredentialsList(stData);
      if (!Array.isArray(stData.tables)) stData.tables = [];

      $('stSectionTitle').value = stData.sectionTitle || '';
      $('stIntroText').value = stData.introText || '';
      renderTablesEditor($('stTablesContainer'), stData.tables, function () {
        updateOutputs();
        scheduleAutosave();
      });

      $('stCredEnabled').checked = Boolean(stData.credentialsEnabled);
      $('stCredFields').classList.toggle('hidden', !stData.credentialsEnabled);
      $('stCredTitle').value = stData.credentialsTitle || 'Target VM Credentials';
      renderCredentialsEditor($('stCredListContainer'), stData.credentialsList, function () {
        updateOutputs();
        scheduleAutosave();
      });

      renderStepsList(stData);
    } else {
      $('rawHtmlTextarea').value = node.rawHtml || '';
    }
  }

  function renderStepsList(stData) {
    const container = $('stepsContainer');
    container.innerHTML = '';
    const steps = (stData.steps || []).map(VLP.migrateStepData);
    stData.steps = steps;

    steps.forEach(function (step, idx) {
      const card = document.createElement('div');
      card.className = 'step-card';
      card.dataset.stepIdx = String(idx);

      const header = document.createElement('div');
      header.className = 'step-card-header';

      const left = document.createElement('div');
      left.style.display = 'flex';
      left.style.alignItems = 'center';
      left.style.gap = '8px';
      const badge = document.createElement('span');
      badge.className = 'step-num-badge';
      badge.textContent = String(idx + 1);
      const title = document.createElement('strong');
      title.textContent = 'Step ' + (idx + 1);
      left.appendChild(badge);
      left.appendChild(title);

      const controls = document.createElement('div');
      controls.style.display = 'flex';
      controls.style.gap = '4px';
      controls.style.flexWrap = 'wrap';

      const hasCtx = Boolean(step.contextText || step._showContext);
      const hasCreds = Boolean((step.credentialsList && step.credentialsList.length > 0) || step._showCreds);
      const hasTables = Boolean((step.tables && step.tables.length > 0) || step._showTables);
      const hasTerm = Boolean(step.termPrompt || step.termCommand || step.termOutput || step._showTerminal);

      const btnCtx = makeTinyBtn(hasCtx ? 'Hide Context' : '+ Context', function () {
        pushUndo();
        step._showContext = !hasCtx;
        if (!step._showContext) {
          step.contextText = '';
        }
        renderStepsList(stData);
        updateOutputs();
        scheduleAutosave();
      });

      const btnTbl = makeTinyBtn('+ Table', function () {
        pushUndo();
        step.tables = step.tables || [];
        step.tables.push(VLP.createDefaultTable());
        step._showTables = true;
        renderStepsList(stData);
        updateOutputs();
        scheduleAutosave();
      });

      const btnCred = makeTinyBtn('+ VM Creds', function () {
        pushUndo();
        step.credentialsList = step.credentialsList || [];
        step.credentialsList.push(VLP.createDefaultCredentialEntry());
        step._showCreds = true;
        renderStepsList(stData);
        updateOutputs();
        scheduleAutosave();
      });

      const btnTerm = makeTinyBtn(hasTerm ? 'Hide Terminal' : '+ Terminal', function () {
        pushUndo();
        step._showTerminal = !hasTerm;
        if (!step._showTerminal) {
          step.termPrompt = '';
          step.termCommand = '';
          step.termOutput = '';
        }
        renderStepsList(stData);
        updateOutputs();
        scheduleAutosave();
      });

      const btnImg = makeTinyBtn('+ Image', function () {
        pendingStepFileTargetIdx = idx;
        $('stepImageFileInput').click();
      });

      const btnUp = makeTinyBtn('↑', function () {
        if (idx === 0) return;
        pushUndo();
        const item = steps.splice(idx, 1)[0];
        steps.splice(idx - 1, 0, item);
        state.activeStepIndex = idx - 1;
        renderStepsList(stData);
        updateOutputs();
        scheduleAutosave();
      });
      btnUp.disabled = idx === 0;

      const btnDown = makeTinyBtn('↓', function () {
        if (idx >= steps.length - 1) return;
        pushUndo();
        const item = steps.splice(idx, 1)[0];
        steps.splice(idx + 1, 0, item);
        state.activeStepIndex = idx + 1;
        renderStepsList(stData);
        updateOutputs();
        scheduleAutosave();
      });
      btnDown.disabled = idx >= steps.length - 1;

      const btnInsertAfter = makeTinyBtn('+ Below', function () {
        pushUndo();
        steps.splice(idx + 1, 0, VLP.createDefaultStep());
        state.activeStepIndex = idx + 1;
        renderStepsList(stData);
        updateOutputs();
        scheduleAutosave();
      });

      const btnDel = makeTinyBtn('Delete', function () {
        pushUndo();
        if (steps.length <= 1) {
          step.instruction = '';
          step.contextText = '';
          step.termPrompt = '';
          step.termCommand = '';
          step.termOutput = '';
          step.credentialsList = [];
          step.tables = [];
          step.images = [];
        } else {
          steps.splice(idx, 1);
        }
        renderStepsList(stData);
        updateOutputs();
        scheduleAutosave();
      });

      controls.appendChild(btnCtx);
      controls.appendChild(btnTbl);
      controls.appendChild(btnCred);
      controls.appendChild(btnTerm);
      controls.appendChild(btnImg);
      controls.appendChild(btnUp);
      controls.appendChild(btnDown);
      controls.appendChild(btnInsertAfter);
      controls.appendChild(btnDel);

      header.appendChild(left);
      header.appendChild(controls);
      card.appendChild(header);

      const body = document.createElement('div');
      body.className = 'step-card-body';

      // Instruction Field
      const instLabel = document.createElement('label');
      instLabel.className = 'field-label';
      instLabel.textContent = 'Step Action & Verification Text (Highlight text & use toolbar buttons / Ctrl+B, Ctrl+I, Ctrl+U, or paste screenshot with Ctrl+V)';
      const instArea = document.createElement('textarea');
      instArea.className = 'textarea';
      instArea.rows = 3;
      instArea.dataset.trackSelection = 'true';
      instArea.dataset.stepField = 'instruction';
      instArea.dataset.stepIdx = String(idx);
      instArea.value = step.instruction || '';
      instArea.placeholder = 'e.g. Click Start, type gpedit.msc, and press Enter.';
      instArea.addEventListener('focus', function () {
        state.activeStepIndex = idx;
      });
      instArea.addEventListener('input', function () {
        step.instruction = instArea.value;
        updateOutputs();
        scheduleAutosave();
      });
      instArea.addEventListener('paste', async function (e) {
        const items = Array.from((e.clipboardData && e.clipboardData.items) || []);
        const imgItems = items.filter(function (it) { return it.type && it.type.startsWith('image/'); });
        if (!imgItems.length) return;
        e.preventDefault();
        const entries = [];
        for (let i = 0; i < imgItems.length; i++) {
          const entry = await ingestImageFile(imgItems[i].getAsFile());
          if (entry) entries.push(entry);
        }
        if (!entries.length) return;
        pushUndo();
        step.images = step.images || [];
        entries.forEach(function (entry) {
          step.images.push({ src: entry.src, alt: 'Step ' + (idx + 1) + ' Screenshot', width: entry.width, height: entry.height });
        });
        renderStepsList(stData);
        updateOutputs();
        scheduleAutosave();
        showToast('Screenshot attached inline to Step ' + (idx + 1));
      });
      body.appendChild(instLabel);
      body.appendChild(instArea);

      // Single Merged Highlighted Context Sub-panel (no auto-filled prefixes)
      if (hasCtx) {
        const ctxBox = document.createElement('div');
        ctxBox.className = 'sub-panel sub-panel-context';
        ctxBox.innerHTML = '<div class="sub-panel-header"><span>Indented Highlighted Context (.step-context)</span></div>';
        const ctxArea = document.createElement('textarea');
        ctxArea.className = 'textarea';
        ctxArea.rows = 2;
        ctxArea.dataset.trackSelection = 'true';
        ctxArea.dataset.stepField = 'context';
        ctxArea.dataset.stepIdx = String(idx);
        ctxArea.placeholder = 'Enter highlighted context, rationale, or callout note (no auto-filled labels)...';
        ctxArea.value = step.contextText || '';
        ctxArea.addEventListener('focus', function () { state.activeStepIndex = idx; });
        ctxArea.addEventListener('input', function () {
          step.contextText = ctxArea.value;
          updateOutputs();
          scheduleAutosave();
        });
        ctxBox.appendChild(ctxArea);
        body.appendChild(ctxBox);
      }

      // Step VM Credentials Sub-panel (Multi-System)
      if (hasCreds && step.credentialsList.length > 0) {
        const credPanel = document.createElement('div');
        credPanel.className = 'sub-panel';
        const credHdr = document.createElement('div');
        credHdr.className = 'sub-panel-header';
        credHdr.innerHTML = '<span>Step VM Credentials (.lab-note)</span>';
        const addSysBtn = makeTinyBtn('+ Add VM System', function () {
          pushUndo();
          step.credentialsList.push(VLP.createDefaultCredentialEntry());
          renderStepsList(stData);
          updateOutputs();
          scheduleAutosave();
        });
        credHdr.appendChild(addSysBtn);
        credPanel.appendChild(credHdr);

        const credListHost = document.createElement('div');
        renderCredentialsEditor(credListHost, step.credentialsList, function () {
          if (step.credentialsList.length === 0) {
            step._showCreds = false;
            renderStepsList(stData);
          }
          updateOutputs();
          scheduleAutosave();
        });
        credPanel.appendChild(credListHost);
        body.appendChild(credPanel);
      }

      // Step Data Tables Sub-panel
      if (hasTables && step.tables.length > 0) {
        const tblPanel = document.createElement('div');
        tblPanel.className = 'sub-panel';
        const tblHdr = document.createElement('div');
        tblHdr.className = 'sub-panel-header';
        tblHdr.innerHTML = '<span>Step Data Tables (.vlp-data-table)</span>';
        const addAnotherTblBtn = makeTinyBtn('+ Add Table', function () {
          pushUndo();
          step.tables.push(VLP.createDefaultTable());
          renderStepsList(stData);
          updateOutputs();
          scheduleAutosave();
        });
        tblHdr.appendChild(addAnotherTblBtn);
        tblPanel.appendChild(tblHdr);

        const tblHost = document.createElement('div');
        renderTablesEditor(tblHost, step.tables, function () {
          if (step.tables.length === 0) {
            step._showTables = false;
            renderStepsList(stData);
          }
          updateOutputs();
          scheduleAutosave();
        });
        tblPanel.appendChild(tblHost);
        body.appendChild(tblPanel);
      }

      // Terminal Verification Output Sub-panel
      if (hasTerm) {
        const termBox = document.createElement('div');
        termBox.className = 'sub-panel';
        termBox.innerHTML = '<div class="sub-panel-header"><span>Terminal Verification Output (.term-box)</span></div>';

        const g2 = document.createElement('div');
        g2.className = 'grid-2';

        const pWrap = document.createElement('div');
        const pLbl = document.createElement('label');
        pLbl.className = 'field-label';
        pLbl.textContent = 'Shell Prompt (.term-prompt)';
        const pIn = document.createElement('input');
        pIn.className = 'input textarea-mono';
        pIn.type = 'text';
        pIn.placeholder = '[admin@host ~]$';
        pIn.value = step.termPrompt || '';
        pIn.addEventListener('input', function () {
          step.termPrompt = pIn.value;
          updateOutputs();
          scheduleAutosave();
        });
        pWrap.appendChild(pLbl);
        pWrap.appendChild(pIn);

        const cWrap = document.createElement('div');
        const cLbl = document.createElement('label');
        cLbl.className = 'field-label';
        cLbl.textContent = 'Command';
        const cIn = document.createElement('input');
        cIn.className = 'input textarea-mono';
        cIn.type = 'text';
        cIn.placeholder = 'whoami';
        cIn.value = step.termCommand || '';
        cIn.addEventListener('input', function () {
          step.termCommand = cIn.value;
          updateOutputs();
          scheduleAutosave();
        });
        cWrap.appendChild(cLbl);
        cWrap.appendChild(cIn);

        g2.appendChild(pWrap);
        g2.appendChild(cWrap);
        termBox.appendChild(g2);

        const oLbl = document.createElement('label');
        oLbl.className = 'field-label';
        oLbl.style.marginTop = '8px';
        oLbl.textContent = 'Expected Terminal Output';
        const oArea = document.createElement('textarea');
        oArea.className = 'textarea textarea-mono';
        oArea.rows = 2;
        oArea.placeholder = 'admin';
        oArea.value = step.termOutput || '';
        oArea.addEventListener('input', function () {
          step.termOutput = oArea.value;
          updateOutputs();
          scheduleAutosave();
        });
        termBox.appendChild(oLbl);
        termBox.appendChild(oArea);
        body.appendChild(termBox);
      }

      // Inline Step Images Sub-panel
      const imgWrap = document.createElement('div');
      imgWrap.className = 'sub-panel';
      const imgHeader = document.createElement('div');
      imgHeader.className = 'sub-panel-header';
      imgHeader.innerHTML = '<span>Inline Step Screenshots (.step-inline-img)</span>';
      const urlAddBtn = makeTinyBtn('+ Add URL / Path', function () {
        pushUndo();
        step.images = step.images || [];
        step.images.push({ src: './images/', alt: 'Step ' + (idx + 1) + ' Screenshot' });
        renderStepsList(stData);
        updateOutputs();
        scheduleAutosave();
      });
      imgHeader.appendChild(urlAddBtn);
      imgWrap.appendChild(imgHeader);

      const dz = document.createElement('div');
      dz.className = 'dropzone';
      dz.tabIndex = 0;
      dz.innerHTML = 'Click to upload, drop image file, or focus &amp; press <strong>Ctrl+V</strong> to paste screenshot for Step ' + (idx + 1);
      dz.addEventListener('click', function () {
        pendingStepFileTargetIdx = idx;
        $('stepImageFileInput').click();
      });
      bindDropzone(dz, function (entries) {
        if (!entries || !entries.length) return;
        pushUndo();
        step.images = step.images || [];
        entries.forEach(function (en) {
          step.images.push({ src: en.src, alt: 'Step ' + (idx + 1) + ' Screenshot', width: en.width, height: en.height });
        });
        renderStepsList(stData);
        updateOutputs();
        scheduleAutosave();
        showToast('Attached ' + entries.length + ' screenshot(s) to Step ' + (idx + 1));
      });
      imgWrap.appendChild(dz);

      const imgs = step.images || [];
      if (imgs.length > 0) {
        const chipList = document.createElement('div');
        chipList.className = 'img-chip-list';
        imgs.forEach(function (im, imIdx) {
          const chip = document.createElement('div');
          chip.className = 'img-chip';

          const thumb = document.createElement('img');
          thumb.alt = im.alt || 'Step image';
          thumb.src = VLP.resolveImageSrc(im.src, {
            imageMode: 'preview',
            imageMap: state.imageMap,
            samplePrefix: state.sampleSource ? '/samples/' + state.sampleSource + '/images' : ''
          });

          const fields = document.createElement('div');
          fields.className = 'img-chip-fields';

          const srcIn = document.createElement('input');
          srcIn.className = 'input';
          srcIn.type = 'text';
          srcIn.value = im.src || '';
          srcIn.placeholder = './images/screenshot.png';
          srcIn.addEventListener('input', function () {
            im.src = srcIn.value;
            thumb.src = VLP.resolveImageSrc(im.src, {
              imageMode: 'preview',
              imageMap: state.imageMap,
              samplePrefix: state.sampleSource ? '/samples/' + state.sampleSource + '/images' : ''
            });
            updateOutputs();
            scheduleAutosave();
          });

          const altIn = document.createElement('input');
          altIn.className = 'input';
          altIn.type = 'text';
          altIn.value = im.alt || '';
          altIn.placeholder = 'Image Alt Description';
          altIn.addEventListener('input', function () {
            im.alt = altIn.value;
            updateOutputs();
            scheduleAutosave();
          });

          fields.appendChild(srcIn);
          fields.appendChild(altIn);

          const rmBtn = makeTinyBtn('×', function () {
            pushUndo();
            imgs.splice(imIdx, 1);
            renderStepsList(stData);
            updateOutputs();
            scheduleAutosave();
          });

          chip.appendChild(thumb);
          chip.appendChild(fields);
          chip.appendChild(rmBtn);
          chipList.appendChild(chip);
        });
        imgWrap.appendChild(chipList);
      }

      body.appendChild(imgWrap);
      card.appendChild(body);
      container.appendChild(card);
    });
  }

  function makeTinyBtn(label, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-xs';
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  // =========================================================================
  // Rendering: Live VLP Preview & HTML / XML Outputs
  // =========================================================================
  function updateOutputs() {
    const info = getActiveInfo();
    if (!info) return;
    const node = info.node;

    const samplePrefix = state.sampleSource ? '/samples/' + state.sampleSource + '/images' : '';
    const colorTheme = (state.manual && state.manual.colorTheme) || 'crimson-slate';
    const previewHtmlSnippet = VLP.generateNodeHtml(node, {
      imageMode: 'preview',
      imageMap: state.imageMap,
      samplePrefix: samplePrefix,
      colorTheme: colorTheme
    });

    const copyHtmlSnippet = VLP.generateNodeHtml(node, {
      imageMode: state.copyImageMode,
      imageMap: state.imageMap,
      colorTheme: colorTheme
    });

    // Update iframe preview with realistic VLP Light / Clarity Dark host simulation
    const isDark = state.previewTheme === 'dark';
    $('previewPane').classList.toggle('dark-sim', isDark);

    const hostCss =
      '    body {\n' +
      '      margin: 0;\n' +
      '      padding: 22px;\n' +
      '      background: ' + (isDark ? '#1b2129' : '#ffffff') + ';\n' +
      '      color: ' + (isDark ? '#e5edf7' : '#1f2937') + ';\n' +
      '      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\n' +
      '    }\n';

    const frame = $('vlpPreviewFrame');
    const isSameNode = lastPreviewedNodeId === node.id;
    let doc = null;
    let win = null;
    try {
      doc = frame.contentDocument || (frame.contentWindow && frame.contentWindow.document);
      win = frame.contentWindow;
    } catch (_ignore) {
      doc = null;
      win = null;
    }

    let prevScrollX = 0;
    let prevScrollY = 0;
    if (isSameNode && previewDocInitialized && doc) {
      const se = doc.scrollingElement || doc.documentElement || doc.body;
      prevScrollX = (win && typeof win.scrollX === 'number') ? win.scrollX : ((se && se.scrollLeft) || 0);
      prevScrollY = (win && typeof win.scrollY === 'number') ? win.scrollY : ((se && se.scrollTop) || 0);
    }

    if (!previewDocInitialized || !doc || !doc.head || !doc.body) {
      const frameDoc =
        '<!DOCTYPE html>\n' +
        '<html lang="en"' + (isDark ? ' class="clr-theme-dark theme-dark dark" data-theme="dark" clr-theme="dark"' : '') + '>\n' +
        '<head>\n' +
        '  <meta charset="UTF-8" />\n' +
        '  <base href="' + window.location.origin + '/" />\n' +
        '  <style id="vlp-host-style">\n' +
        hostCss +
        '  </style>\n' +
        '</head>\n' +
        '<body' + (isDark ? ' class="theme-dark"' : '') + '>\n' +
        previewHtmlSnippet + '\n' +
        '</body>\n' +
        '</html>';

      if (doc) {
        doc.open();
        doc.write(frameDoc);
        doc.close();
        previewDocInitialized = true;
        win = frame.contentWindow;
      } else {
        frame.srcdoc = frameDoc;
        previewDocInitialized = true;
      }
    } else {
      const htmlEl = doc.documentElement;
      if (isDark) {
        htmlEl.className = 'clr-theme-dark theme-dark dark';
        htmlEl.setAttribute('data-theme', 'dark');
        htmlEl.setAttribute('clr-theme', 'dark');
        doc.body.className = 'theme-dark';
      } else {
        htmlEl.className = '';
        htmlEl.removeAttribute('data-theme');
        htmlEl.removeAttribute('clr-theme');
        doc.body.className = '';
      }

      let baseStyle = doc.getElementById('vlp-host-style');
      if (!baseStyle) {
        baseStyle = doc.createElement('style');
        baseStyle.id = 'vlp-host-style';
        doc.head.appendChild(baseStyle);
      }
      baseStyle.textContent = hostCss;
      doc.body.innerHTML = previewHtmlSnippet;
    }

    lastPreviewedNodeId = node.id;

    if (doc && win) {
      const targetX = isSameNode ? prevScrollX : 0;
      const targetY = isSameNode ? prevScrollY : 0;
      const applyScroll = function () {
        try { win.scrollTo(targetX, targetY); } catch (_ignore) {}
      };
      if (previewScrollRafId !== null) {
        cancelAnimationFrame(previewScrollRafId);
        previewScrollRafId = null;
      }
      applyScroll();
      if (isSameNode && (targetX > 0 || targetY > 0)) {
        previewScrollRafId = requestAnimationFrame(function () {
          previewScrollRafId = null;
          applyScroll();
        });
        doc.body.querySelectorAll('img').forEach(function (imgEl) {
          if (!imgEl.complete) {
            imgEl.addEventListener('load', applyScroll, { once: true });
          }
        });
      }
    }

    $('htmlOutputText').value = copyHtmlSnippet;
    $('htmlStatsLabel').textContent = copyHtmlSnippet.length.toLocaleString() + ' chars';

    // Single-node XML preview
    const miniManual = {
      id: state.manual.id,
      name: state.manual.name,
      defaultLanguageCode: state.manual.defaultLanguageCode,
      dataFormat: state.manual.dataFormat,
      contentNodes: [node]
    };
    $('xmlOutputText').value = VLP.serializeManualToXml(miniManual, state.imageMap);
  }

  function renderOutputTabs() {
    $('outTabPreview').classList.toggle('active', state.outTab === 'preview');
    $('outTabHtml').classList.toggle('active', state.outTab === 'html');
    $('outTabXml').classList.toggle('active', state.outTab === 'xml');

    $('previewPane').classList.toggle('hidden', state.outTab !== 'preview');
    $('htmlOutputPane').classList.toggle('hidden', state.outTab !== 'html');
    $('xmlOutputPane').classList.toggle('hidden', state.outTab !== 'xml');
    $('previewThemeToggleWrap').classList.toggle('hidden', state.outTab !== 'preview');

    $('themeBtnLight').classList.toggle('active', state.previewTheme === 'light');
    $('themeBtnDark').classList.toggle('active', state.previewTheme === 'dark');
    $('copyImageModeSelect').value = state.copyImageMode;
  }

  function renderAll() {
    renderTree();
    renderEditor();
    renderOutputTabs();
    updateOutputs();
  }

  // =========================================================================
  // Toolbar Actions & Selection Tracking
  // =========================================================================
  document.addEventListener('focusin', function (e) {
    if (e.target && e.target.dataset && e.target.dataset.trackSelection === 'true') {
      state.lastFocusedEl = e.target;
      state.lastSelection = {
        start: e.target.selectionStart || 0,
        end: e.target.selectionEnd || 0
      };
    }
  });

  ['keyup', 'mouseup', 'select', 'input'].forEach(function (evtName) {
    document.addEventListener(evtName, function (e) {
      if (e.target && e.target.dataset && e.target.dataset.trackSelection === 'true') {
        state.lastFocusedEl = e.target;
        state.lastSelection = {
          start: e.target.selectionStart || 0,
          end: e.target.selectionEnd || 0
        };
      }
    });
  });

  function resolveActiveTextTarget() {
    let target = state.lastFocusedEl;
    if (!target || !document.body.contains(target) || target.offsetParent === null) {
      const info = getActiveInfo();
      if (!info) return null;
      if (info.node.mode === 'overview') target = $('ovOverviewText');
      else if (info.node.mode === 'raw') target = $('rawHtmlTextarea');
      else {
        const areas = $('stepsContainer').querySelectorAll('textarea[data-step-field="instruction"]');
        target = areas[state.activeStepIndex] || areas[0];
      }
    }
    return target;
  }

  function applyInlineWrap(tagId) {
    const catalog = VLP.getToolbarCatalog();
    const item = catalog.find(function (c) { return c.id === tagId; });
    if (!item || !item.insertWrap) return;

    const target = resolveActiveTextTarget();
    if (!target) return;

    pushUndo();
    const val = target.value || '';
    const start = typeof target.selectionStart === 'number' ? target.selectionStart : state.lastSelection.start;
    const end = typeof target.selectionEnd === 'number' ? target.selectionEnd : state.lastSelection.end;
    const selected = val.slice(start, end);
    const inner = selected || item.defaultPlaceholder;
    const wrapped = item.insertWrap[0] + inner + item.insertWrap[1];

    target.value = val.slice(0, start) + wrapped + val.slice(end);
    target.focus();
    const newStart = start + item.insertWrap[0].length;
    const newEnd = newStart + inner.length;
    target.setSelectionRange(newStart, newEnd);
    target.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function applyListWrap(listTag) {
    const target = resolveActiveTextTarget();
    if (!target) return;
    pushUndo();
    const tag = listTag === 'ol' ? 'ol' : 'ul';
    const val = target.value || '';
    const start = typeof target.selectionStart === 'number' ? target.selectionStart : state.lastSelection.start;
    const end = typeof target.selectionEnd === 'number' ? target.selectionEnd : state.lastSelection.end;
    const selected = val.slice(start, end).trim();
    const rawLines = selected ? selected.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean) : ['List item 1', 'List item 2'];
    const listHtml = '<' + tag + '>\n' + rawLines.map(function (l) { return '  <li>' + l + '</li>'; }).join('\n') + '\n</' + tag + '>';

    target.value = val.slice(0, start) + listHtml + val.slice(end);
    target.focus();
    target.setSelectionRange(start, start + listHtml.length);
    target.dispatchEvent(new Event('input', { bubbles: true }));
  }

  document.addEventListener('keydown', function (e) {
    const target = e.target;
    if (!target || !target.dataset || target.dataset.trackSelection !== 'true') return;
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === 'b' && !e.shiftKey) {
      e.preventDefault();
      applyInlineWrap('bold');
    } else if (key === 'i' && !e.shiftKey) {
      e.preventDefault();
      applyInlineWrap('italic');
    } else if (key === 'u' && !e.shiftKey) {
      e.preventDefault();
      applyInlineWrap('underline');
    } else if (key === 's' && e.shiftKey) {
      e.preventDefault();
      applyInlineWrap('strike');
    }
  });

  function handleOverviewToolbarAction(action) {
    const info = getActiveInfo();
    if (!info || info.node.mode !== 'overview') return;
    const ov = info.node.overview;
    if (action === 'focus-title') {
      $('ovCourseTitle').focus();
    } else if (action === 'focus-banner') {
      $('ovBannerSrc').focus();
    } else if (action === 'add-table') {
      pushUndo();
      ov.tables = ov.tables || [];
      ov.tables.push(VLP.createDefaultTable());
      renderEditor();
      updateOutputs();
      scheduleAutosave();
    } else if (action === 'toggle-divider') {
      pushUndo();
      ov.showDivider = !ov.showDivider;
      renderEditor();
      updateOutputs();
      scheduleAutosave();
    } else if (action === 'toggle-purpose') {
      pushUndo();
      ov.purposeEnabled = !ov.purposeEnabled;
      renderEditor();
      updateOutputs();
      scheduleAutosave();
      if (ov.purposeEnabled) $('ovPurposeText').focus();
    } else if (action === 'toggle-credentials') {
      pushUndo();
      ov.credentialsEnabled = !ov.credentialsEnabled;
      if (ov.credentialsEnabled && (!ov.credentialsList || ov.credentialsList.length === 0)) {
        ov.credentialsList = [VLP.createDefaultCredentialEntry()];
      }
      renderEditor();
      updateOutputs();
      scheduleAutosave();
    }
  }

  function handleStepsToolbarAction(action) {
    const info = getActiveInfo();
    if (!info || info.node.mode !== 'steps') return;
    const stData = info.node.stepsData;
    const steps = stData.steps;
    const idx = Math.min(Math.max(0, state.activeStepIndex), Math.max(0, steps.length - 1));

    if (action === 'focus-header') {
      $('stSectionTitle').focus();
    } else if (action === 'add-step') {
      pushUndo();
      steps.push(VLP.createDefaultStep());
      state.activeStepIndex = steps.length - 1;
      renderStepsList(stData);
      updateOutputs();
      scheduleAutosave();
      const areas = $('stepsContainer').querySelectorAll('textarea[data-step-field="instruction"]');
      if (areas[state.activeStepIndex]) areas[state.activeStepIndex].focus();
    } else if (action === 'add-context') {
      if (!steps[idx]) return;
      if (!steps[idx]._showContext) pushUndo();
      steps[idx]._showContext = true;
      renderStepsList(stData);
      updateOutputs();
      scheduleAutosave();
    } else if (action === 'add-table') {
      if (!steps[idx]) return;
      pushUndo();
      steps[idx].tables = steps[idx].tables || [];
      steps[idx].tables.push(VLP.createDefaultTable());
      steps[idx]._showTables = true;
      renderStepsList(stData);
      updateOutputs();
      scheduleAutosave();
    } else if (action === 'add-vm-creds') {
      if (!steps[idx]) return;
      pushUndo();
      steps[idx].credentialsList = steps[idx].credentialsList || [];
      steps[idx].credentialsList.push(VLP.createDefaultCredentialEntry());
      steps[idx]._showCreds = true;
      renderStepsList(stData);
      updateOutputs();
      scheduleAutosave();
    } else if (action === 'add-terminal') {
      if (!steps[idx]) return;
      if (!steps[idx]._showTerminal) pushUndo();
      steps[idx]._showTerminal = true;
      renderStepsList(stData);
      updateOutputs();
      scheduleAutosave();
    } else if (action === 'add-image') {
      pendingStepFileTargetIdx = idx;
      $('stepImageFileInput').click();
    }
  }

  // =========================================================================
  // Modals: Templates, Button Guide & Sample Manuals
  // =========================================================================
  let currentModalTab = 'templates';

  function openTemplatesModal(tab, focusGuideId) {
    currentModalTab = tab || 'templates';
    syncStartupGuideCheckbox();
    $('templatesModal').classList.add('open');
    renderTemplatesModalBody(focusGuideId);
  }

  function closeModal(id) {
    $(id).classList.remove('open');
  }

  function applyTemplateToCurrent(tpl) {
    const info = getActiveInfo();
    if (!info) return;
    pushUndo();
    const node = info.node;
    node.mode = tpl.mode;
    node.overview = JSON.parse(JSON.stringify(tpl.overview));
    node.stepsData = JSON.parse(JSON.stringify(tpl.stepsData));
    node.rawHtml = '';
    if (!node.title || node.title === 'New Chapter' || /^Step \d+$/.test(node.title)) {
      node.title = tpl.nodeTitle;
    }
    closeModal('templatesModal');
    renderAll();
    scheduleAutosave();
    showToast('Applied template: ' + tpl.name);
  }

  function addTemplateAsNewNode(tpl) {
    pushUndo();
    const newNode = {
      id: VLP.generateUuid(),
      title: tpl.nodeTitle,
      orderIndex: 0,
      languageCode: state.manual.defaultLanguageCode || 'en',
      mode: tpl.mode,
      overview: JSON.parse(JSON.stringify(tpl.overview)),
      stepsData: JSON.parse(JSON.stringify(tpl.stepsData)),
      rawHtml: '',
      images: [],
      children: []
    };
    const root = state.manual.contentNodes[0];
    if (tpl.mode === 'overview') {
      root.children = root.children || [];
      root.children.push(newNode);
    } else {
      root.children = root.children || [];
      let parentChap = root.children.find(function (c) { return c.id === state.activeNodeId; });
      if (!parentChap) parentChap = root.children[root.children.length - 1];
      if (!parentChap) {
        parentChap = {
          id: VLP.generateUuid(),
          title: 'Lab Module',
          orderIndex: 0,
          languageCode: 'en',
          mode: 'overview',
          overview: VLP.createDefaultOverviewData(),
          stepsData: VLP.createDefaultStepsData(),
          rawHtml: '',
          images: [],
          children: []
        };
        root.children.push(parentChap);
      }
      parentChap.children = parentChap.children || [];
      parentChap.children.push(newNode);
    }
    state.activeNodeId = newNode.id;
    closeModal('templatesModal');
    renderAll();
    scheduleAutosave();
    showToast('Created page from template: ' + tpl.name);
  }

  function renderTemplatesModalBody(focusGuideId) {
    $('modalTabTemplates').classList.toggle('active', currentModalTab === 'templates');
    $('modalTabGuide').classList.toggle('active', currentModalTab === 'guide');
    $('modalTabSamples').classList.toggle('active', currentModalTab === 'samples');

    const body = $('templatesModalBody');
    body.innerHTML = '';

    if (currentModalTab === 'templates') {
      const grid = document.createElement('div');
      grid.className = 'template-grid';
      VLP.getTemplates().forEach(function (tpl) {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.innerHTML =
          '<div>' +
          '  <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">' +
          '    <strong>' + VLP.escapeHtml(tpl.name) + '</strong>' +
          '    <span class="badge">' + VLP.escapeHtml(tpl.badge) + '</span>' +
          '  </div>' +
          '  <p class="muted-hint" style="margin:0 0 10px;">' + VLP.escapeHtml(tpl.description) + '</p>' +
          '</div>';

        const btnRow = document.createElement('div');
        btnRow.style.display = 'flex';
        btnRow.style.gap = '6px';
        btnRow.style.flexWrap = 'wrap';

        const btnReplace = document.createElement('button');
        btnReplace.type = 'button';
        btnReplace.className = 'btn btn-sm btn-primary';
        btnReplace.textContent = 'Apply to Current Page';
        btnReplace.addEventListener('click', function () { applyTemplateToCurrent(tpl); });

        const btnNew = document.createElement('button');
        btnNew.type = 'button';
        btnNew.className = 'btn btn-sm';
        btnNew.textContent = 'Add as New Page';
        btnNew.addEventListener('click', function () { addTemplateAsNewNode(tpl); });

        btnRow.appendChild(btnReplace);
        btnRow.appendChild(btnNew);
        card.appendChild(btnRow);
        grid.appendChild(card);
      });
      body.appendChild(grid);
    } else if (currentModalTab === 'guide') {
      const topControls = document.createElement('div');
      topControls.style.display = 'flex';
      topControls.style.justifyContent = 'space-between';
      topControls.style.alignItems = 'center';
      topControls.style.marginBottom = '12px';
      topControls.innerHTML =
        '<span class="muted-hint">Live demonstrations of every formatting button from <code>vlp-manual-html-formatter.txt</code>.</span>';
      const themeToggle = document.createElement('button');
      themeToggle.type = 'button';
      themeToggle.className = 'btn btn-sm btn-blue';
      themeToggle.textContent = state.previewTheme === 'dark' ? 'Switch Demo to Light Mode' : 'Switch Demo to VLP Dark Mode';
      themeToggle.addEventListener('click', function () {
        state.previewTheme = state.previewTheme === 'dark' ? 'light' : 'dark';
        renderOutputTabs();
        updateOutputs();
        renderTemplatesModalBody(focusGuideId);
      });
      topControls.appendChild(themeToggle);
      body.appendChild(topControls);

      const isDark = state.previewTheme === 'dark';
      const activeStyleBlock = VLP.getMasterStyleBlock((state.manual && state.manual.colorTheme) || 'crimson-slate');
      VLP.getToolbarCatalog().forEach(function (item) {
        const card = document.createElement('div');
        card.className = 'guide-card';
        card.id = 'guide-card-' + item.id;
        if (focusGuideId === item.id) {
          card.style.borderColor = '#38bdf8';
          card.style.boxShadow = '0 0 0 2px rgba(56,189,248,0.25)';
        }
        card.innerHTML =
          '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">' +
          '  <div><strong>' + VLP.escapeHtml(item.label) + '</strong> <span class="badge">' + VLP.escapeHtml(item.category.toUpperCase()) + '</span></div>' +
          '  <code style="font-size:11px; color:#7dd3fc;">' + VLP.escapeHtml(item.tagPreview) + '</code>' +
          '</div>' +
          '<p style="margin:6px 0 4px;">' + VLP.escapeHtml(item.summary) + '</p>' +
          '<div class="muted-hint"><strong>When to use:</strong> ' + VLP.escapeHtml(item.whenToUse) + ' &bull; <strong>Shortcut:</strong> <code>' + VLP.escapeHtml(item.shortcut) + '</code></div>' +
          '<div class="guide-preview-box' + (isDark ? ' dark-sim clr-theme-dark theme-dark' : '') + '">' +
          '  <div class="lab-wrapper" style="max-width:100%;">' + activeStyleBlock + item.demoHtml + '</div>' +
          '</div>';

        body.appendChild(card);
      });

      if (focusGuideId) {
        setTimeout(function () {
          const target = $('guide-card-' + focusGuideId);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
      }
    } else {
      body.innerHTML =
        '<div class="template-grid">' +
        '  <div class="template-card">' +
        '    <div>' +
        '      <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><strong>Annex B: dsac.annexb.lab01-en</strong><span class="badge">End-Goal Reference</span></div>' +
        '      <p class="muted-hint">Demonstrates formatted Course Overview, Target VM Credentials cards, formatted Procedural Step tables with inline screenshots, plus legacy sections you can inspect or consolidate.</p>' +
        '    </div>' +
        '    <button type="button" id="modalBtnAnnexB" class="btn btn-sm btn-primary">Load Annex B Manual</button>' +
        '  </div>' +
        '  <div class="template-card">' +
        '    <div>' +
        '      <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><strong>Annex C: dsac.annexc.lab01-en</strong><span class="badge">XML Structure Reference</span></div>' +
        '      <p class="muted-hint">Multi-chapter VLP XML manual (4 chapters, 42 child micro-steps with legacy Word/CKEditor HTML). Great for testing 1-click Chapter Step Consolidation.</p>' +
        '    </div>' +
        '    <button type="button" id="modalBtnAnnexC" class="btn btn-sm btn-blue">Load Annex C Manual</button>' +
        '  </div>' +
        '</div>';

      $('modalBtnAnnexB').addEventListener('click', function () {
        closeModal('templatesModal');
        loadSampleManual('annexb');
      });
      $('modalBtnAnnexC').addEventListener('click', function () {
        closeModal('templatesModal');
        loadSampleManual('annexc');
      });
    }
  }

  // =========================================================================
  // Sample Manuals, XML / ZIP Import & Export
  // =========================================================================
  async function loadSampleManual(sampleKey) {
    try {
      const res = await fetch('/api/samples/' + encodeURIComponent(sampleKey));
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load sample');
      pushUndo();
      state.manual = normalizeManualData(data.manual);
      state.sampleSource = data.sampleKey;
      state.imageMap = Object.assign({}, state.imageMap, data.imageMap || {});
      state.activeNodeId = state.manual.contentNodes[0] ? state.manual.contentNodes[0].id : null;
      state.activeStepIndex = 0;
      applyColorTheme(state.manual.colorTheme);
      renderAll();
      scheduleAutosave();
      showToast('Loaded ' + (sampleKey === 'annexb' ? 'Annex B' : 'Annex C') + ' reference manual');
    } catch (err) {
      showToast('Error loading sample: ' + err.message, true);
    }
  }

  async function handlePackageImport(file) {
    if (!file) return;
    try {
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.xml')) {
        const xmlText = await file.text();
        const manual = normalizeManualData(VLP.parseXmlToManual(xmlText));
        pushUndo();
        state.manual = manual;
        state.sampleSource = '';
        state.activeNodeId = manual.contentNodes[0] ? manual.contentNodes[0].id : null;
        applyColorTheme(state.manual.colorTheme);
        renderAll();
        scheduleAutosave();
        showToast('Imported content.xml: ' + manual.name);
      } else if (lower.endsWith('.zip')) {
        const buf = await file.arrayBuffer();
        const res = await fetch('/api/import-zip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/zip' },
          body: buf
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'ZIP import failed');
        pushUndo();
        state.manual = normalizeManualData(data.manual);
        state.sampleSource = '';
        state.imageMap = Object.assign({}, state.imageMap, data.imageMap || {});
        state.activeNodeId = data.manual.contentNodes[0] ? data.manual.contentNodes[0].id : null;
        applyColorTheme(state.manual.colorTheme);
        renderAll();
        scheduleAutosave();
        showToast('Imported VLP ZIP package: ' + data.manual.name);
      } else {
        showToast('Please select a .xml or .zip VLP package file', true);
      }
    } catch (err) {
      showToast('Import failed: ' + err.message, true);
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function exportContentXml() {
    const xml = VLP.serializeManualToXml(state.manual, state.imageMap);
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    downloadBlob(blob, 'content.xml');
    showToast('Downloaded content.xml');
  }

  async function exportVlpZip() {
    try {
      const res = await fetch('/api/export-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manual: state.manual,
          imagesMeta: state.imageMap,
          sampleSource: state.sampleSource
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(function () { return {}; });
        throw new Error(err.error || 'ZIP export failed');
      }
      const blob = await res.blob();
      const lang = state.manual.defaultLanguageCode || 'en';
      const safeName = (state.manual.name || 'vlp.manual').replace(/[^a-zA-Z0-9._-]/g, '_');
      const zipName = (safeName.endsWith('-' + lang) ? safeName : safeName + '-' + lang) + '.zip';
      downloadBlob(blob, zipName);
      showToast('Exported VLP package: ' + zipName);
    } catch (err) {
      showToast('Export ZIP failed: ' + err.message, true);
    }
  }

  // =========================================================================
  // Session Snapshots & Portable JSON Backup
  // =========================================================================
  async function refreshSnapshotsList() {
    const listEl = $('snapshotsList');
    listEl.innerHTML = 'Loading saved snapshots...';
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load sessions');
      const sessions = data.sessions || [];
      if (sessions.length === 0) {
        listEl.innerHTML = '<span class="muted-hint">No named snapshots yet. Your active session is still automatically saved on every change.</span>';
        return;
      }
      listEl.innerHTML = '';
      sessions.forEach(function (s) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        row.style.gap = '8px';
        row.style.padding = '8px 0';
        row.style.borderBottom = '1px solid var(--app-border)';

        const info = document.createElement('div');
        info.innerHTML =
          '<div><strong>' + VLP.escapeHtml(s.name) + '</strong></div>' +
          '<div class="muted-hint">' + VLP.escapeHtml(s.manualName || 'manual') + ' &bull; ' + s.nodeCount + ' nodes &bull; ' + VLP.escapeHtml(s.updatedAt.replace('T', ' ').slice(0, 19)) + '</div>';

        const btns = document.createElement('div');
        btns.style.display = 'flex';
        btns.style.gap = '6px';

        const loadBtn = makeTinyBtn('Restore', async function () {
          const r = await fetch('/api/sessions/' + encodeURIComponent(s.id));
          const d = await r.json();
          if (r.ok && d.ok && d.session && d.session.state) {
            pushUndo();
            restoreSerializedState(d.session.state);
            closeModal('sessionsModal');
            scheduleAutosave();
            showToast('Restored snapshot: ' + s.name);
          }
        });

        const delBtn = makeTinyBtn('Delete', async function () {
          await fetch('/api/sessions/' + encodeURIComponent(s.id), { method: 'DELETE' });
          refreshSnapshotsList();
        });

        btns.appendChild(loadBtn);
        btns.appendChild(delBtn);
        row.appendChild(info);
        row.appendChild(btns);
        listEl.appendChild(row);
      });
    } catch (err) {
      listEl.innerHTML = '<span class="muted-hint">Server snapshots unavailable in offline browser mode.</span>';
    }
  }

  function restoreSerializedState(saved) {
    if (!saved || !saved.manual) return false;
    state.manual = normalizeManualData(saved.manual);
    state.activeNodeId = saved.activeNodeId || (saved.manual.contentNodes[0] && saved.manual.contentNodes[0].id);
    state.imageMap = Object.assign({}, state.imageMap, saved.imageMap || {});
    state.sampleSource = saved.sampleSource || '';
    if (saved.previewTheme) state.previewTheme = saved.previewTheme;
    if (saved.copyImageMode) state.copyImageMode = saved.copyImageMode;
    applyColorTheme(state.manual.colorTheme);
    updateUndoRedoButtons();
    renderAll();
    return true;
  }

  // =========================================================================
  // Event Wiring
  // =========================================================================
  function bindEvents() {
    populateColorThemeDropdown();

    $('colorThemeSelect').addEventListener('change', function () {
      const nextTheme = $('colorThemeSelect').value;
      if (state.manual && state.manual.colorTheme !== nextTheme) {
        pushUndo();
      }
      applyColorTheme(nextTheme);
      updateOutputs();
      scheduleAutosave();
    });

    // Topbar buttons & startup guide preference
    $('btnUndo').addEventListener('click', performUndo);
    $('btnRedo').addEventListener('click', performRedo);
    $('btnOpenTemplates').addEventListener('click', function () { openTemplatesModal('templates'); });
    $('btnShowGuideModal').addEventListener('click', function () { openTemplatesModal('guide'); });

    const chkHideGuide = $('chkHideGuideStartup');
    if (chkHideGuide) {
      syncStartupGuideCheckbox();
      chkHideGuide.addEventListener('change', function () {
        try {
          if (chkHideGuide.checked) {
            localStorage.setItem(HIDE_GUIDE_KEY, 'true');
          } else {
            localStorage.removeItem(HIDE_GUIDE_KEY);
          }
        } catch (_ignore) {}
      });
    }

    // Typing-burst undo capture & global Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z
    document.addEventListener('beforeinput', function (e) {
      if (e.inputType === 'historyUndo' || e.inputType === 'historyRedo') return;
      if (isManualTextField(e.target)) {
        armTypingUndo(e.target);
      }
    });

    document.addEventListener('focusout', function (e) {
      if (typingUndoTarget && e.target === typingUndoTarget) {
        resetTypingBurst();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const target = e.target;
      if (target && target.closest && target.closest('.modal-backdrop.open')) return;
      if (target && target.id === 'quickPasteInput') return;

      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        if (isManualTextField(target) || state.undoStack.length > 0) {
          e.preventDefault();
          performUndo();
        }
      } else if ((key === 'y' && !e.shiftKey) || (key === 'z' && e.shiftKey)) {
        if (isManualTextField(target) || state.redoStack.length > 0) {
          e.preventDefault();
          performRedo();
        }
      }
    });
    $('btnLoadAnnexB').addEventListener('click', function () { loadSampleManual('annexb'); });
    $('btnLoadAnnexC').addEventListener('click', function () { loadSampleManual('annexc'); });
    $('btnOpenSessions').addEventListener('click', function () {
      $('sessionsModal').classList.add('open');
      $('snapshotNameInput').value = (state.manual && state.manual.name ? state.manual.name : 'Manual') + ' Snapshot';
      refreshSnapshotsList();
    });
    $('importPackageInput').addEventListener('change', function (e) {
      const file = e.target.files[0];
      e.target.value = '';
      handlePackageImport(file);
    });
    $('btnExportXml').addEventListener('click', exportContentXml);
    $('btnExportZip').addEventListener('click', exportVlpZip);

    // Tree controls
    $('btnNewManual').addEventListener('click', function () {
      pushUndo();
      state.manual = createBlankManual();
      state.sampleSource = '';
      state.activeNodeId = state.manual.contentNodes[0].id;
      applyColorTheme(state.manual.colorTheme);
      renderAll();
      scheduleAutosave();
      showToast('Started new blank manual');
    });
    $('btnAddChapter').addEventListener('click', addChapterNode);
    $('btnAddStepNode').addEventListener('click', addStepPageNode);

    $('manualNameInput').addEventListener('input', function () {
      state.manual.name = $('manualNameInput').value;
      updateOutputs();
      scheduleAutosave();
    });
    $('manualLangInput').addEventListener('input', function () {
      state.manual.defaultLanguageCode = $('manualLangInput').value || 'en';
      updateOutputs();
      scheduleAutosave();
    });

    // Node title & mode switch
    $('nodeTitleInput').addEventListener('input', function () {
      const info = getActiveInfo();
      if (!info) return;
      info.node.title = $('nodeTitleInput').value;
      renderTree();
      updateOutputs();
      scheduleAutosave();
    });

    ['modeBtnOverview', 'modeBtnSteps', 'modeBtnRaw'].forEach(function (id) {
      $(id).addEventListener('click', function () {
        const info = getActiveInfo();
        if (!info) return;
        const targetMode = $(id).dataset.mode;
        if (info.node.mode === targetMode) return;
        pushUndo();
        if (targetMode === 'raw' && info.node.mode !== 'raw') {
          info.node.rawHtml = VLP.generateNodeHtml(info.node, { imageMode: 'vlp' });
        }
        info.node.mode = targetMode;
        renderAll();
        scheduleAutosave();
      });
    });

    // Chapter Consolidation
    $('btnConsolidateChapter').addEventListener('click', function () {
      const info = getActiveInfo();
      if (!info || !info.node.children || info.node.children.length === 0) return;
      pushUndo();
      const consolidated = VLP.consolidateChapterSteps(info.node);
      info.siblings[info.index] = consolidated;
      if (consolidated.children && consolidated.children.length > 0) {
        state.activeNodeId = consolidated.children[0].id;
      } else {
        state.activeNodeId = consolidated.id;
      }
      renderAll();
      scheduleAutosave();
      showToast('Consolidated chapter steps into VLP table!');
    });

    // Raw HTML conversion buttons
    $('btnConvertRawToSteps').addEventListener('click', function () {
      const info = getActiveInfo();
      if (!info) return;
      pushUndo();
      const converted = VLP.convertLegacyContentToStep(info.node.rawHtml || '', info.node.title, info.node.images);
      info.node.mode = 'steps';
      info.node.stepsData = Object.assign(VLP.createDefaultStepsData(), {
        sectionTitle: info.node.title || 'Lab Procedure',
        steps: [converted]
      });
      renderAll();
      scheduleAutosave();
      showToast('Converted page to VLP Procedural Steps');
    });

    $('btnConvertRawToOverview').addEventListener('click', function () {
      const info = getActiveInfo();
      if (!info) return;
      pushUndo();
      info.node.overview = VLP.convertLegacyNodeToOverview(info.node);
      info.node.mode = 'overview';
      renderAll();
      scheduleAutosave();
      showToast('Converted page to VLP Course Overview');
    });

    $('rawHtmlTextarea').addEventListener('input', function () {
      const info = getActiveInfo();
      if (!info) return;
      info.node.rawHtml = $('rawHtmlTextarea').value;
      updateOutputs();
      scheduleAutosave();
    });

    // Sticky Toolbar (prevent mousedown from stealing textarea selection!)
    $('editorToolbar').addEventListener('mousedown', function (e) {
      if (e.target.closest('button')) {
        e.preventDefault();
      }
    });

    $('editorToolbar').querySelectorAll('[data-inline-tag]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyInlineWrap(btn.dataset.inlineTag);
      });
    });

    $('editorToolbar').querySelectorAll('[data-list-type]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyListWrap(btn.dataset.listType);
      });
    });

    $('editorToolbar').querySelectorAll('[data-overview-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        handleOverviewToolbarAction(btn.dataset.overviewAction);
      });
    });

    $('editorToolbar').querySelectorAll('[data-steps-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        handleStepsToolbarAction(btn.dataset.stepsAction);
      });
    });

    $('editorToolbar').querySelectorAll('[data-guide-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openTemplatesModal('guide', btn.dataset.guideId);
      });
    });

    // Overview inputs
    $('ovCourseTitle').addEventListener('input', function () {
      const info = getActiveInfo();
      if (!info) return;
      info.node.overview.courseTitle = $('ovCourseTitle').value;
      updateOutputs();
      scheduleAutosave();
    });
    $('ovBannerAlt').addEventListener('input', function () {
      const info = getActiveInfo();
      if (!info) return;
      info.node.overview.bannerAlt = $('ovBannerAlt').value;
      updateOutputs();
      scheduleAutosave();
    });
    $('ovBannerSrc').addEventListener('input', function () {
      const info = getActiveInfo();
      if (!info) return;
      info.node.overview.bannerSrc = $('ovBannerSrc').value;
      updateOutputs();
      scheduleAutosave();
    });
    $('ovBannerClearBtn').addEventListener('click', function () {
      const info = getActiveInfo();
      if (!info) return;
      if (!info.node.overview.bannerSrc && !$('ovBannerSrc').value) return;
      pushUndo();
      info.node.overview.bannerSrc = '';
      $('ovBannerSrc').value = '';
      updateOutputs();
      scheduleAutosave();
    });
    $('ovBannerFileInput').addEventListener('change', async function (e) {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      const entry = await ingestImageFile(file);
      const info = getActiveInfo();
      if (entry && info) {
        pushUndo();
        info.node.overview.bannerSrc = entry.src;
        $('ovBannerSrc').value = entry.src;
        updateOutputs();
        scheduleAutosave();
        showToast('Banner image attached');
      }
    });
    bindDropzone($('ovBannerDropzone'), function (entries) {
      const info = getActiveInfo();
      if (!info || !entries.length) return;
      pushUndo();
      info.node.overview.bannerSrc = entries[0].src;
      $('ovBannerSrc').value = entries[0].src;
      updateOutputs();
      scheduleAutosave();
      showToast('Banner image attached');
    });

    $('ovOverviewText').addEventListener('input', function () {
      const info = getActiveInfo();
      if (!info) return;
      info.node.overview.overviewText = $('ovOverviewText').value;
      updateOutputs();
      scheduleAutosave();
    });
    $('ovShowDivider').addEventListener('change', function () {
      const info = getActiveInfo();
      if (!info) return;
      pushUndo();
      info.node.overview.showDivider = $('ovShowDivider').checked;
      updateOutputs();
      scheduleAutosave();
    });
    $('ovPurposeEnabled').addEventListener('change', function () {
      const info = getActiveInfo();
      if (!info) return;
      pushUndo();
      info.node.overview.purposeEnabled = $('ovPurposeEnabled').checked;
      $('ovPurposeFields').classList.toggle('hidden', !info.node.overview.purposeEnabled);
      updateOutputs();
      scheduleAutosave();
    });
    $('ovPurposeTitle').addEventListener('input', function () {
      const info = getActiveInfo();
      if (!info) return;
      info.node.overview.purposeTitle = $('ovPurposeTitle').value;
      updateOutputs();
      scheduleAutosave();
    });
    $('ovPurposeText').addEventListener('input', function () {
      const info = getActiveInfo();
      if (!info) return;
      info.node.overview.purposeText = $('ovPurposeText').value;
      updateOutputs();
      scheduleAutosave();
    });

    $('btnAddOverviewTable').addEventListener('click', function () {
      const info = getActiveInfo();
      if (!info) return;
      pushUndo();
      info.node.overview.tables = info.node.overview.tables || [];
      info.node.overview.tables.push(VLP.createDefaultTable());
      renderEditor();
      updateOutputs();
      scheduleAutosave();
    });

    $('ovCredEnabled').addEventListener('change', function () {
      const info = getActiveInfo();
      if (!info) return;
      pushUndo();
      info.node.overview.credentialsEnabled = $('ovCredEnabled').checked;
      if (info.node.overview.credentialsEnabled && (!info.node.overview.credentialsList || info.node.overview.credentialsList.length === 0)) {
        info.node.overview.credentialsList = [VLP.createDefaultCredentialEntry()];
      }
      renderEditor();
      updateOutputs();
      scheduleAutosave();
    });
    $('ovCredTitle').addEventListener('input', function () {
      const info = getActiveInfo();
      if (!info) return;
      info.node.overview.credentialsTitle = $('ovCredTitle').value;
      updateOutputs();
      scheduleAutosave();
    });
    $('btnAddOverviewCred').addEventListener('click', function () {
      const info = getActiveInfo();
      if (!info) return;
      pushUndo();
      info.node.overview.credentialsEnabled = true;
      info.node.overview.credentialsList = info.node.overview.credentialsList || [];
      info.node.overview.credentialsList.push(VLP.createDefaultCredentialEntry());
      renderEditor();
      updateOutputs();
      scheduleAutosave();
    });

    // Procedural Steps Inputs
    $('stSectionTitle').addEventListener('input', function () {
      const info = getActiveInfo();
      if (!info) return;
      info.node.stepsData.sectionTitle = $('stSectionTitle').value;
      updateOutputs();
      scheduleAutosave();
    });
    $('stIntroText').addEventListener('input', function () {
      const info = getActiveInfo();
      if (!info) return;
      info.node.stepsData.introText = $('stIntroText').value;
      updateOutputs();
      scheduleAutosave();
    });
    $('btnAddStepsIntroTable').addEventListener('click', function () {
      const info = getActiveInfo();
      if (!info) return;
      pushUndo();
      info.node.stepsData.tables = info.node.stepsData.tables || [];
      info.node.stepsData.tables.push(VLP.createDefaultTable());
      renderEditor();
      updateOutputs();
      scheduleAutosave();
    });
    $('stCredEnabled').addEventListener('change', function () {
      const info = getActiveInfo();
      if (!info) return;
      pushUndo();
      info.node.stepsData.credentialsEnabled = $('stCredEnabled').checked;
      if (info.node.stepsData.credentialsEnabled && (!info.node.stepsData.credentialsList || info.node.stepsData.credentialsList.length === 0)) {
        info.node.stepsData.credentialsList = [VLP.createDefaultCredentialEntry()];
      }
      renderEditor();
      updateOutputs();
      scheduleAutosave();
    });
    $('stCredTitle').addEventListener('input', function () {
      const info = getActiveInfo();
      if (!info) return;
      info.node.stepsData.credentialsTitle = $('stCredTitle').value;
      updateOutputs();
      scheduleAutosave();
    });
    $('btnAddStepsCred').addEventListener('click', function () {
      const info = getActiveInfo();
      if (!info) return;
      pushUndo();
      info.node.stepsData.credentialsEnabled = true;
      info.node.stepsData.credentialsList = info.node.stepsData.credentialsList || [];
      info.node.stepsData.credentialsList.push(VLP.createDefaultCredentialEntry());
      renderEditor();
      updateOutputs();
      scheduleAutosave();
    });
    $('btnAddStepBottom').addEventListener('click', function () {
      handleStepsToolbarAction('add-step');
    });

    // Quick Paste Raw Text -> Steps
    $('btnToggleQuickPaste').addEventListener('click', function () {
      $('quickPastePanel').classList.toggle('hidden');
    });

    function runQuickPaste(replaceExisting) {
      const raw = $('quickPasteInput').value;
      const parsed = VLP.parseRawTextToSteps(raw);
      if (!parsed.steps.length) {
        showToast('Paste one or more lines or numbered steps first', true);
        return;
      }
      const info = getActiveInfo();
      if (!info) return;
      pushUndo();
      const stData = info.node.stepsData;
      if (parsed.sectionTitle && !stData.sectionTitle) stData.sectionTitle = parsed.sectionTitle;
      if (parsed.introText && !stData.introText) stData.introText = parsed.introText;
      if (replaceExisting) {
        stData.steps = parsed.steps;
      } else {
        const isSingleBlank = stData.steps.length === 1 && !stData.steps[0].instruction && !(stData.steps[0].images || []).length;
        stData.steps = isSingleBlank ? parsed.steps : stData.steps.concat(parsed.steps);
      }
      renderStepsList(stData);
      updateOutputs();
      scheduleAutosave();
      showToast((replaceExisting ? 'Replaced with ' : 'Appended ') + parsed.steps.length + ' step(s)');
    }

    $('btnQuickPasteAppend').addEventListener('click', function () { runQuickPaste(false); });
    $('btnQuickPasteReplace').addEventListener('click', function () { runQuickPaste(true); });

    // Reusable Step image file input
    $('stepImageFileInput').addEventListener('change', async function (e) {
      const files = Array.from(e.target.files || []);
      e.target.value = '';
      if (!files.length || pendingStepFileTargetIdx === null) return;
      const targetStepIdx = pendingStepFileTargetIdx;
      pendingStepFileTargetIdx = null;
      const info = getActiveInfo();
      if (!info || info.node.mode !== 'steps') return;
      const step = info.node.stepsData.steps[targetStepIdx];
      if (!step) return;
      const entries = [];
      for (let i = 0; i < files.length; i++) {
        const entry = await ingestImageFile(files[i]);
        if (entry) entries.push(entry);
      }
      if (!entries.length) return;
      pushUndo();
      step.images = step.images || [];
      entries.forEach(function (entry) {
        step.images.push({
          src: entry.src,
          alt: 'Step ' + (targetStepIdx + 1) + ' Screenshot',
          width: entry.width,
          height: entry.height
        });
      });
      renderStepsList(info.node.stepsData);
      updateOutputs();
      scheduleAutosave();
      showToast('Attached ' + entries.length + ' inline step image(s)');
    });

    // Preview & Output Controls
    ['outTabPreview', 'outTabHtml', 'outTabXml'].forEach(function (id) {
      $(id).addEventListener('click', function () {
        state.outTab = $(id).dataset.outTab;
        renderOutputTabs();
      });
    });

    ['themeBtnLight', 'themeBtnDark'].forEach(function (id) {
      $(id).addEventListener('click', function () {
        state.previewTheme = $(id).dataset.previewTheme;
        renderOutputTabs();
        updateOutputs();
        scheduleAutosave();
      });
    });

    $('copyImageModeSelect').addEventListener('change', function () {
      state.copyImageMode = $('copyImageModeSelect').value;
      updateOutputs();
      scheduleAutosave();
    });

    $('btnCopyHtml').addEventListener('click', async function () {
      const html = $('htmlOutputText').value;
      try {
        await navigator.clipboard.writeText(html);
        showToast('Copied VLP HTML snippet to clipboard!');
      } catch (_err) {
        $('htmlOutputPane').classList.remove('hidden');
        $('htmlOutputText').select();
        document.execCommand('copy');
        renderOutputTabs();
        showToast('Copied VLP HTML snippet!');
      }
    });

    // Modal tabs & close
    ['modalTabTemplates', 'modalTabGuide', 'modalTabSamples'].forEach(function (id) {
      $(id).addEventListener('click', function () {
        currentModalTab = $(id).dataset.modalTab;
        renderTemplatesModalBody();
      });
    });

    document.querySelectorAll('[data-close-modal]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        closeModal(btn.dataset.closeModal);
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(function (bd) {
      bd.addEventListener('click', function (e) {
        if (e.target === bd) bd.classList.remove('open');
      });
    });

    // Sessions Modal actions
    $('btnRefreshSnapshots').addEventListener('click', refreshSnapshotsList);
    $('btnSaveSnapshot').addEventListener('click', async function () {
      const name = $('snapshotNameInput').value.trim() || 'Manual Snapshot';
      const payload = buildSerializableState();
      try {
        const res = await fetch('/api/sessions/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, state: payload })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'Save failed');
        refreshSnapshotsList();
        showToast('Saved snapshot: ' + name);
      } catch (err) {
        showToast('Could not save server snapshot: ' + err.message, true);
      }
    });

    $('btnExportJsonBackup').addEventListener('click', function () {
      const payload = buildSerializableState();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const safeName = (state.manual.name || 'vlp-project').replace(/[^a-zA-Z0-9._-]/g, '_');
      downloadBlob(blob, safeName + '-backup.json');
      showToast('Downloaded JSON project backup');
    });

    $('importJsonBackupInput').addEventListener('change', async function (e) {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text());
        pushUndo();
        if (!restoreSerializedState(parsed)) {
          throw new Error('Invalid project backup JSON');
        }
        closeModal('sessionsModal');
        scheduleAutosave();
        showToast('Restored project from JSON backup');
      } catch (err) {
        showToast('JSON restore failed: ' + err.message, true);
      }
    });

    // Accidental closure protection
    window.addEventListener('beforeunload', function (e) {
      flushAutosaveBeacon();
      if (state.hasPendingSave) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') {
        flushAutosaveBeacon();
      }
    });
  }

  // =========================================================================
  // Initialization
  // =========================================================================
  async function init() {
    bindEvents();
    await preloadBundledSvgAssets();

    let browserSaved = null;
    let serverSaved = null;

    try {
      const idbRec = await idbGet('autosave');
      if (idbRec && idbRec.state && idbRec.state.manual) {
        browserSaved = idbRec.state;
      }
    } catch (_ignore) {}

    try {
      const res = await fetch('/api/sessions/autosave');
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.exists && json.session && json.session.state && json.session.state.manual) {
          serverSaved = json.session.state;
        }
      }
    } catch (_ignore) {}

    let chosen = null;
    if (browserSaved && serverSaved) {
      chosen = String(browserSaved.updatedAt || '') >= String(serverSaved.updatedAt || '')
        ? browserSaved
        : serverSaved;
    } else {
      chosen = browserSaved || serverSaved;
    }

    if (chosen) {
      restoreSerializedState(chosen);
      setSaveStatus('ok', 'Restored Session • ' + formatTime());
      showToast('Session auto-restored');
    } else {
      state.manual = normalizeManualData(createStarterManual());
      state.activeNodeId = state.manual.contentNodes[0].id;
      applyColorTheme(state.manual.colorTheme);
      updateUndoRedoButtons();
      renderAll();
      setSaveStatus('ok', 'Starter Templates Loaded');
    }

    if (!shouldHideGuideOnStartup()) {
      openTemplatesModal('guide');
    }
  }

  init();
})();
