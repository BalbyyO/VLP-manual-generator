(function () {
  'use strict';

  const VLP = window.VLPFormatter;

  const HIDE_GUIDE_KEY = 'vlp_hide_guide_on_startup';
  const UI_THEME_KEY = 'vlp_ui_theme';
  const MAX_UNDO_HISTORY = 40;
  const TYPING_BURST_MS = 900;

  function getInitialUiTheme() {
    try {
      return localStorage.getItem(UI_THEME_KEY) === 'light' ? 'light' : 'dark';
    } catch (_ignore) {
      return 'dark';
    }
  }

  // =========================================================================
  // Application State
  // =========================================================================
  const state = {
    manual: null,
    activeNodeId: null,
    activeStepIndex: 0,
    imageMap: {},
    sampleSource: '',
    uiTheme: getInitialUiTheme(), // 'dark' | 'light'
    previewTheme: 'dark',         // 'light' | 'dark'
    previewRatio: 'auto',         // 'auto' | '360' | '520' | '900'
    mobilePane: 'editor',         // 'tree' | 'editor' | 'preview'
    outTab: 'preview',            // 'preview' | 'html' | 'xml'
    copyImageMode: 'vlp',         // 'vlp' | 'base64'
    undoStack: [],
    redoStack: [],
    hasPendingSave: false,
    lastFocusedEl: null,
    lastSelection: { start: 0, end: 0 },
    currentUser: null,
    publicConfig: null,
    authNeedsSetup: false,
    authLocked: true
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

  function getUserAutosaveKey() {
    return 'autosave_' + (state.currentUser && state.currentUser.id ? state.currentUser.id : 'anon');
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
        localStorage.setItem('vlp_autosave_fallback_' + id, JSON.stringify(payload));
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
        const raw = localStorage.getItem('vlp_autosave_fallback_' + id);
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
      previewRatio: state.previewRatio,
      copyImageMode: state.copyImageMode,
      updatedAt: new Date().toISOString()
    };
  }

  async function saveToServerNow(payload) {
    if (state.authLocked) return false;
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
    if (state.authLocked || !state.manual) return;
    state.hasPendingSave = true;
    setSaveStatus('saving', 'Saving...');
    clearTimeout(autosaveBrowserTimer);
    clearTimeout(autosaveServerTimer);

    const slotKey = getUserAutosaveKey();
    autosaveBrowserTimer = setTimeout(async function () {
      const payload = buildSerializableState();
      await idbSet(slotKey, payload);
    }, 250);

    autosaveServerTimer = setTimeout(async function () {
      const payload = buildSerializableState();
      await idbSet(slotKey, payload);
      await saveToServerNow(payload);
    }, 1100);
  }

  function flushAutosaveBeacon() {
    if (state.authLocked || !state.manual) return;
    const payload = buildSerializableState();
    try {
      localStorage.setItem('vlp_autosave_meta_' + getUserAutosaveKey(), JSON.stringify({ updatedAt: payload.updatedAt, name: state.manual.name }));
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
  // UI Theme, Responsive Panes, Popovers, Color Themes & Builders
  // =========================================================================
  function applyUiTheme(theme, opts) {
    const next = theme === 'light' ? 'light' : 'dark';
    state.uiTheme = next;
    document.documentElement.dataset.uiTheme = next;
    try {
      localStorage.setItem(UI_THEME_KEY, next);
    } catch (_ignore) {}

    const btn = $('btnUiThemeToggle');
    const iconEl = $('uiThemeIcon');
    const labelEl = $('uiThemeLabel');
    if (btn) btn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
    if (iconEl) iconEl.textContent = next === 'dark' ? '\u263E' : '\u2600';
    if (labelEl) labelEl.textContent = next === 'dark' ? 'Dark' : 'Light';

    if (opts && opts.syncPreview) {
      state.previewTheme = next;
      if (state.manual) {
        renderOutputTabs();
        updateOutputs();
      }
    }
  }

  function setMobilePane(paneName) {
    const next = paneName || 'editor';
    state.mobilePane = next;
    document.querySelectorAll('#mobilePaneTabs [data-mobile-pane]').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.mobilePane === next);
    });
    document.querySelectorAll('.workspace > .pane[data-pane]').forEach(function (pane) {
      pane.classList.toggle('mobile-pane-active', pane.dataset.pane === next);
    });
  }

  function applyPreviewRatio() {
    const frame = $('vlpPreviewFrame');
    const pane = $('previewPane');
    const sel = $('previewRatioSelect');
    const ratio = state.previewRatio || 'auto';
    if (sel) sel.value = ratio;
    if (!frame || !pane) return;
    if (ratio === 'auto') {
      pane.classList.remove('ratio-constrained');
      frame.style.width = '100%';
    } else {
      pane.classList.add('ratio-constrained');
      frame.style.width = ratio + 'px';
    }
  }

  function closeAllPopovers() {
    const pairs = [
      ['btnColorTheme', 'colorThemeMenu'],
      ['btnExportMenu', 'exportMenuPopover']
    ];
    pairs.forEach(function (pair) {
      const btn = $(pair[0]);
      const menu = $(pair[1]);
      if (menu) menu.classList.add('hidden');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  function positionFixedPopover(triggerEl, popoverEl, alignRight) {
    if (!triggerEl || !popoverEl) return;
    const rect = triggerEl.getBoundingClientRect();
    popoverEl.style.visibility = 'hidden';
    popoverEl.classList.remove('hidden');
    const popRect = popoverEl.getBoundingClientRect();
    const margin = 8;
    let left = alignRight ? (rect.right - popRect.width) : rect.left;
    if (left + popRect.width > window.innerWidth - margin) {
      left = window.innerWidth - popRect.width - margin;
    }
    if (left < margin) left = margin;

    let top = rect.bottom + 6;
    if (top + popRect.height > window.innerHeight - margin && rect.top - popRect.height - 6 >= margin) {
      top = rect.top - popRect.height - 6;
    }
    if (top < margin) top = margin;

    popoverEl.style.left = Math.round(left) + 'px';
    popoverEl.style.top = Math.round(top) + 'px';
    popoverEl.style.visibility = '';
  }

  function togglePopover(triggerEl, popoverEl, alignRight) {
    if (!triggerEl || !popoverEl) return;
    const wasHidden = popoverEl.classList.contains('hidden');
    closeAllPopovers();
    if (wasHidden) {
      positionFixedPopover(triggerEl, popoverEl, alignRight);
      triggerEl.setAttribute('aria-expanded', 'true');
    }
  }

  function populateColorThemeDropdown() {
    const menu = $('colorThemeMenu');
    if (!menu) return;
    menu.innerHTML = '';
    const activeId = (state.manual && state.manual.colorTheme) || 'crimson-slate';
    VLP.getColorThemes().forEach(function (t) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-option-btn' + (t.id === activeId ? ' active' : '');
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', t.id === activeId ? 'true' : 'false');
      btn.dataset.themeId = t.id;

      const left = document.createElement('span');
      left.className = 'theme-option-left';

      const dots = document.createElement('span');
      dots.className = 'theme-dots';
      dots.setAttribute('aria-hidden', 'true');
      [t.swatch, t.light.cardBorder, t.cmd.bg].forEach(function (clr) {
        const d = document.createElement('span');
        d.className = 'theme-dot-mini';
        d.style.background = clr;
        dots.appendChild(d);
      });

      const name = document.createElement('span');
      name.className = 'theme-option-name';
      name.textContent = t.name;

      left.appendChild(dots);
      left.appendChild(name);

      const check = document.createElement('span');
      check.className = 'theme-option-check';
      check.textContent = '\u2713';

      btn.appendChild(left);
      btn.appendChild(check);

      btn.addEventListener('click', function () {
        closeAllPopovers();
        if (state.manual && state.manual.colorTheme !== t.id) {
          pushUndo();
        }
        applyColorTheme(t.id);
        updateOutputs();
        scheduleAutosave();
      });

      menu.appendChild(btn);
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
    const label = $('colorThemeLabel');
    if (label) label.textContent = t.name;

    const menu = $('colorThemeMenu');
    if (menu) {
      menu.querySelectorAll('[data-theme-id]').forEach(function (btn) {
        const isActive = btn.dataset.themeId === t.id;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    }
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
      const htmlThemeAttrs = isDark
        ? ' class="clr-theme-dark theme-dark dark" data-theme="dark" clr-theme="dark"'
        : ' class="theme-light clr-theme-light" data-theme="light" clr-theme="light"';
      const frameDoc =
        '<!DOCTYPE html>\n' +
        '<html lang="en"' + htmlThemeAttrs + '>\n' +
        '<head>\n' +
        '  <meta charset="UTF-8" />\n' +
        '  <base href="' + window.location.origin + '/" />\n' +
        '  <style id="vlp-host-style">\n' +
        hostCss +
        '  </style>\n' +
        '</head>\n' +
        '<body class="' + (isDark ? 'theme-dark' : 'theme-light') + '">\n' +
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
        htmlEl.className = 'theme-light clr-theme-light';
        htmlEl.setAttribute('data-theme', 'light');
        htmlEl.setAttribute('clr-theme', 'light');
        doc.body.className = 'theme-light';
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
    if ($('previewRatioSelect')) {
      $('previewRatioSelect').classList.toggle('hidden', state.outTab !== 'preview');
    }

    $('themeBtnLight').classList.toggle('active', state.previewTheme === 'light');
    $('themeBtnDark').classList.toggle('active', state.previewTheme === 'dark');
    $('copyImageModeSelect').value = state.copyImageMode;
    applyPreviewRatio();
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
          '  <code style="font-size:11px; color:var(--app-blue);">' + VLP.escapeHtml(item.tagPreview) + '</code>' +
          '</div>' +
          '<p style="margin:6px 0 4px;">' + VLP.escapeHtml(item.summary) + '</p>' +
          '<div class="muted-hint"><strong>When to use:</strong> ' + VLP.escapeHtml(item.whenToUse) + ' &bull; <strong>Shortcut:</strong> <code>' + VLP.escapeHtml(item.shortcut) + '</code></div>' +
          '<div class="guide-preview-box' + (isDark ? ' dark-sim clr-theme-dark theme-dark' : ' theme-light clr-theme-light') + '"' + (isDark ? ' data-theme="dark" clr-theme="dark"' : ' data-theme="light" clr-theme="light"') + '>' +
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

  async function exportDocument(formatOverride, scopeOverride) {
    if (!state.manual) return;
    const scopeEl = $('exportScopeSelect');
    const format = formatOverride || 'pdf';
    const scope = scopeOverride || (scopeEl ? scopeEl.value : 'full');

    if (format === 'print') {
      const htmlStr = VLP.generateStandaloneManualHtml(state.manual, {
        scope: scope,
        activeNodeId: state.activeNodeId,
        imageMap: state.imageMap,
        samplePrefix: state.sampleSource ? '/samples/' + state.sampleSource + '/images' : '',
        colorTheme: state.manual.colorTheme || 'crimson-slate'
      });
      const printWin = window.open('', '_blank');
      if (!printWin) {
        showToast('Please allow popups for Print / Save as PDF, or choose .pdf download directly', true);
        return;
      }
      printWin.document.open();
      printWin.document.write(htmlStr);
      printWin.document.close();
      setTimeout(function () {
        try { printWin.print(); } catch (_ignore) {}
      }, 250);
      return;
    }

    try {
      const res = await fetch('/api/export-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manual: state.manual,
          format: format,
          scope: scope,
          activeNodeId: state.activeNodeId,
          imagesMeta: state.imageMap,
          sampleSource: state.sampleSource
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(function () { return {}; });
        throw new Error(err.error || 'Document export failed');
      }
      const blob = await res.blob();
      const safeName = (state.manual.name || 'vlp-manual').replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = safeName + (scope === 'current' ? '-page' : '') + '.' + format;
      downloadBlob(blob, fileName);
      showToast('Exported student file: ' + fileName);
    } catch (err) {
      showToast('Export failed: ' + err.message, true);
    }
  }

  // =========================================================================
  // Session Snapshots, Shared Team Manuals & Portable JSON Backup
  // =========================================================================
  function renderSnapshotRow(listEl, s, options) {
    const opts = options || {};
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.justifyContent = 'space-between';
    row.style.gap = '8px';
    row.style.padding = '8px 0';
    row.style.borderBottom = '1px solid var(--app-border)';

    const info = document.createElement('div');
    const byLine = opts.isShared && s.authorName ? (' &bull; by ' + VLP.escapeHtml(s.authorName)) : '';
    info.innerHTML =
      '<div><strong>' + VLP.escapeHtml(s.name) + '</strong></div>' +
      '<div class="muted-hint">' + VLP.escapeHtml(s.manualName || 'manual') + ' &bull; ' + s.nodeCount + ' nodes' + byLine + ' &bull; ' + VLP.escapeHtml((s.updatedAt || '').replace('T', ' ').slice(0, 19)) + '</div>';

    const btns = document.createElement('div');
    btns.style.display = 'flex';
    btns.style.gap = '6px';
    btns.style.flexWrap = 'wrap';

    const endpoint = opts.isShared ? '/api/sessions-shared/' : '/api/sessions/';
    const loadBtn = makeTinyBtn('Restore', async function () {
      const r = await fetch(endpoint + encodeURIComponent(s.id));
      const d = await r.json();
      if (r.ok && d.ok && d.session && d.session.state) {
        pushUndo();
        restoreSerializedState(d.session.state);
        closeModal('accountAdminModal');
        scheduleAutosave();
        showToast('Restored snapshot: ' + s.name);
      }
    });
    btns.appendChild(loadBtn);

    if (!opts.isShared) {
      const shareBtn = makeTinyBtn('Share', async function () {
        const r = await fetch('/api/sessions/' + encodeURIComponent(s.id));
        const d = await r.json();
        if (r.ok && d.ok && d.session && d.session.state) {
          await fetch('/api/sessions-shared', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: s.name, state: d.session.state })
          });
          refreshSharedSnapshotsList();
          showToast('Shared snapshot to Team Manuals');
        }
      });
      btns.appendChild(shareBtn);
    }

    const canDelete = !opts.isShared || (state.currentUser && (state.currentUser.role === 'admin' || state.currentUser.id === s.ownerId));
    if (canDelete) {
      const delBtn = makeTinyBtn('Delete', async function () {
        await fetch(endpoint + encodeURIComponent(s.id), { method: 'DELETE' });
        if (opts.isShared) refreshSharedSnapshotsList();
        else refreshSnapshotsList();
      });
      btns.appendChild(delBtn);
    }

    row.appendChild(info);
    row.appendChild(btns);
    listEl.appendChild(row);
  }

  async function refreshSnapshotsList() {
    const listEl = $('snapshotsList');
    if (!listEl) return;
    listEl.innerHTML = 'Loading saved snapshots...';
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load sessions');
      const sessions = data.sessions || [];
      if (sessions.length === 0) {
        listEl.innerHTML = '<span class="muted-hint">No named snapshots yet. Your active session is automatically saved privately on every change.</span>';
        return;
      }
      listEl.innerHTML = '';
      sessions.forEach(function (s) { renderSnapshotRow(listEl, s, { isShared: false }); });
    } catch (err) {
      listEl.innerHTML = '<span class="muted-hint">Server snapshots unavailable in offline browser mode.</span>';
    }
  }

  async function refreshSharedSnapshotsList() {
    const listEl = $('sharedSnapshotsList');
    if (!listEl) return;
    listEl.innerHTML = 'Loading shared team manuals...';
    try {
      const res = await fetch('/api/sessions-shared');
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed');
      const sessions = data.sessions || [];
      if (sessions.length === 0) {
        listEl.innerHTML = '<span class="muted-hint">No shared team manuals yet. Click "Share Current Manual" to publish a starter or snapshot for other instructors.</span>';
        return;
      }
      listEl.innerHTML = '';
      sessions.forEach(function (s) { renderSnapshotRow(listEl, s, { isShared: true }); });
    } catch (err) {
      listEl.innerHTML = '<span class="muted-hint">Shared team manuals unavailable.</span>';
    }
  }

  function restoreSerializedState(saved) {
    if (!saved || !saved.manual) return false;
    state.manual = normalizeManualData(saved.manual);
    state.activeNodeId = saved.activeNodeId || (saved.manual.contentNodes[0] && saved.manual.contentNodes[0].id);
    state.imageMap = Object.assign({}, state.imageMap, saved.imageMap || {});
    state.sampleSource = saved.sampleSource || '';
    if (saved.previewTheme) state.previewTheme = saved.previewTheme;
    if (saved.previewRatio) state.previewRatio = saved.previewRatio;
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

    $('btnColorTheme').addEventListener('click', function (e) {
      e.stopPropagation();
      togglePopover($('btnColorTheme'), $('colorThemeMenu'), false);
    });

    $('btnUiThemeToggle').addEventListener('click', function () {
      const next = state.uiTheme === 'dark' ? 'light' : 'dark';
      applyUiTheme(next, { syncPreview: true });
      scheduleAutosave();
    });

    $('btnExportMenu').addEventListener('click', function (e) {
      e.stopPropagation();
      togglePopover($('btnExportMenu'), $('exportMenuPopover'), true);
    });

    $('exportMenuPopover').addEventListener('click', function (e) {
      e.stopPropagation();
    });

    $('btnExportXml').addEventListener('click', function () {
      closeAllPopovers();
      exportContentXml();
    });

    $('btnExportZip').addEventListener('click', function () {
      closeAllPopovers();
      exportVlpZip();
    });

    $('exportMenuPopover').querySelectorAll('[data-export-doc]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const docFormat = btn.dataset.exportDoc;
        closeAllPopovers();
        exportDocument(docFormat);
      });
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('#colorThemeDropdown') && !e.target.closest('#exportMenuWrap')) {
        closeAllPopovers();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeAllPopovers();
      }
    });

    window.addEventListener('resize', closeAllPopovers);

    document.querySelectorAll('#mobilePaneTabs [data-mobile-pane]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setMobilePane(btn.dataset.mobilePane);
      });
    });

    // Topbar buttons & startup guide preference
    $('btnUndo').addEventListener('click', performUndo);
    $('btnRedo').addEventListener('click', performRedo);
    $('btnOpenTemplates').addEventListener('click', function () { openTemplatesModal('templates'); });
    $('btnShowGuideModal').addEventListener('click', function () { openTemplatesModal('guide'); });
    if ($('btnReportBug')) {
      $('btnReportBug').addEventListener('click', openBugReport);
    }

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
    $('importPackageInput').addEventListener('change', function (e) {
      const file = e.target.files[0];
      e.target.value = '';
      handlePackageImport(file);
    });
    $('btnUserAccount').addEventListener('click', function () { openAccountAdminModal('account'); });

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

    if ($('previewRatioSelect')) {
      $('previewRatioSelect').addEventListener('change', function () {
        state.previewRatio = $('previewRatioSelect').value || 'auto';
        applyPreviewRatio();
        scheduleAutosave();
      });
    }

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

    // Auth Gate & Open WebUI Account/Admin Events
    bindAuthAndAdminEvents();

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
  // Multi-User Authentication Gate & Open WebUI-Style Account / Admin Panel
  // =========================================================================
  let currentAuthMode = 'login'; // 'setup' | 'login' | 'signup' | 'pending'
  let currentOwuiTab = 'account';
  let currentAdminSaveHandler = null;

  function setAuthError(msg) {
    const el = $('authGateError');
    if (!el) return;
    if (!msg) {
      el.classList.add('hidden');
      el.textContent = '';
    } else {
      el.textContent = msg;
      el.classList.remove('hidden');
    }
  }

  function updateTopbarUserUi(user) {
    const btn = $('btnUserAccount');
    if (!btn) return;
    if (!user) {
      btn.classList.add('hidden');
      $('owuiAdminNavSection').classList.add('hidden');
      return;
    }
    btn.classList.remove('hidden');
    const initials = (user.name || user.username || 'U').trim().charAt(0).toUpperCase();
    $('userAvatarDot').textContent = initials;
    $('userDisplayLabel').textContent = user.name || user.username;
    const chip = $('userRoleChip');
    chip.textContent = user.role;
    chip.className = 'role-chip' + (user.role === 'admin' ? ' role-admin' : (user.role === 'pending' ? ' role-pending' : ''));

    $('owuiFooterAvatar').textContent = initials;
    $('owuiFooterName').textContent = user.name || user.username;
    $('owuiFooterRole').textContent = user.role;
    $('owuiAdminNavSection').classList.toggle('hidden', user.role !== 'admin');
  }

  function configureAuthGateView(mode, publicConfig) {
    currentAuthMode = mode;
    setAuthError('');
    const cfg = publicConfig || state.publicConfig || {};
    const pendingBox = $('authPendingView');
    const form = $('authGateForm');
    const toggleWrap = $('authModeToggleWrap');

    pendingBox.classList.add('hidden');
    form.classList.remove('hidden');
    $('authMfaField').classList.add('hidden');
    $('authTotpInput').value = '';

    const hasExternalSso = Boolean(cfg.oauthEnabled || cfg.ldapEnabled);
    $('authSsoNotice').classList.toggle('hidden', !hasExternalSso);
    if (hasExternalSso) {
      const labels = [];
      if (cfg.oauthEnabled) labels.push('OAuth/OIDC (' + (cfg.oauthProviderName || 'SSO') + ')');
      if (cfg.ldapEnabled) labels.push('LDAP');
      $('authSsoLabel').textContent = 'External auth configured by admin: ' + labels.join(' & ') + ' (local offline fallback active).';
    }

    if (mode === 'pending') {
      form.classList.add('hidden');
      toggleWrap.classList.add('hidden');
      pendingBox.classList.remove('hidden');
      $('authGateTitle').textContent = cfg.pendingOverlayTitle || 'Account Pending Approval';
      $('authGateSubtitle').textContent = 'Multi-user access requires administrator activation.';
      $('pendingOverlayHeading').textContent = cfg.pendingOverlayTitle || 'Waiting for Administrator Approval';
      $('pendingOverlayBody').textContent = cfg.pendingOverlayContent || 'Your local account has been registered. An administrator must upgrade your role from Pending before you can create or access manuals.';
      $('pendingAdminContact').textContent = (cfg.showAdminDetails && cfg.adminContactEmail)
        ? ('Administrator contact: ' + cfg.adminContactEmail)
        : '';
      return;
    }

    if (mode === 'setup') {
      $('authGateTitle').textContent = 'Create Administrator Account';
      $('authGateSubtitle').textContent = 'First-time setup: this first account becomes the system Administrator and owns the Admin Panel.';
      $('authSignupFields').classList.remove('hidden');
      $('authLoginFields').classList.add('hidden');
      $('btnAuthSubmit').textContent = 'Create Admin Account';
      toggleWrap.classList.add('hidden');
      return;
    }

    if (mode === 'signup') {
      $('authGateTitle').textContent = 'Create Local Account';
      $('authGateSubtitle').textContent = cfg.defaultUserRole === 'pending'
        ? 'New accounts start as Pending until approved by an administrator.'
        : 'Create your private instructor/student manual workspace account.';
      $('authSignupFields').classList.remove('hidden');
      $('authLoginFields').classList.add('hidden');
      $('btnAuthSubmit').textContent = 'Create Account';
      toggleWrap.classList.remove('hidden');
      $('authModePrompt').textContent = 'Already have an account?';
      $('btnToggleAuthMode').textContent = 'Sign In';
      return;
    }

    // Default 'login' mode
    $('authGateTitle').textContent = 'Sign In to VLP Manual Generator';
    $('authGateSubtitle').textContent = 'Your drafts, screenshots, and exports are privately isolated to your account.';
    $('authSignupFields').classList.add('hidden');
    $('authLoginFields').classList.remove('hidden');
    $('btnAuthSubmit').textContent = 'Sign In';

    const canSignUp = cfg.enableSignUp !== false && cfg.enableLoginForm !== false;
    toggleWrap.classList.toggle('hidden', !canSignUp);
    $('authModePrompt').textContent = 'Need an account?';
    $('btnToggleAuthMode').textContent = 'Sign Up';
  }

  function makeOwuiSwitchRow(title, desc, checked, disabled) {
    const row = document.createElement('div');
    row.className = 'owui-row';

    const labelDiv = document.createElement('div');
    labelDiv.className = 'owui-row-label';
    const tEl = document.createElement('div');
    tEl.className = 'owui-row-title';
    tEl.textContent = title;
    labelDiv.appendChild(tEl);
    if (desc) {
      const dEl = document.createElement('div');
      dEl.className = 'owui-row-desc';
      dEl.textContent = desc;
      labelDiv.appendChild(dEl);
    }

    const sw = document.createElement('label');
    sw.className = 'owui-switch';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = Boolean(checked);
    input.disabled = Boolean(disabled);
    const slider = document.createElement('span');
    slider.className = 'owui-slider';
    sw.appendChild(input);
    sw.appendChild(slider);

    row.appendChild(labelDiv);
    row.appendChild(sw);
    return { row: row, input: input };
  }

  function makeOwuiSelectRow(title, desc, value, choices, disabled) {
    const row = document.createElement('div');
    row.className = 'owui-row';

    const labelDiv = document.createElement('div');
    labelDiv.className = 'owui-row-label';
    const tEl = document.createElement('div');
    tEl.className = 'owui-row-title';
    tEl.textContent = title;
    labelDiv.appendChild(tEl);
    if (desc) {
      const dEl = document.createElement('div');
      dEl.className = 'owui-row-desc';
      dEl.textContent = desc;
      labelDiv.appendChild(dEl);
    }

    const sel = document.createElement('select');
    sel.className = 'owui-select owui-select-compact';
    sel.disabled = Boolean(disabled);
    choices.forEach(function (ch) {
      const opt = document.createElement('option');
      opt.value = ch.value;
      opt.textContent = ch.label;
      if (String(ch.value) === String(value || '')) opt.selected = true;
      sel.appendChild(opt);
    });

    row.appendChild(labelDiv);
    row.appendChild(sel);
    return { row: row, select: sel };
  }

  function makeOwuiInputField(title, desc, value, opts) {
    const o = opts || {};
    const wrap = document.createElement('div');
    wrap.className = 'owui-field-block';

    const tEl = document.createElement('div');
    tEl.className = 'owui-row-title';
    tEl.style.marginBottom = '4px';
    tEl.textContent = title;
    wrap.appendChild(tEl);

    const input = document.createElement('input');
    input.className = 'owui-input';
    input.type = o.isPassword ? 'password' : 'text';
    input.value = value != null ? String(value) : '';
    input.placeholder = o.placeholder || '';
    input.disabled = Boolean(o.disabled);

    if (o.isPassword) {
      const pwWrap = document.createElement('div');
      pwWrap.className = 'owui-pw-wrap';
      const eye = document.createElement('button');
      eye.type = 'button';
      eye.className = 'owui-pw-eye';
      eye.innerHTML = '&#128065;';
      eye.addEventListener('click', function () {
        input.type = input.type === 'password' ? 'text' : 'password';
      });
      pwWrap.appendChild(input);
      pwWrap.appendChild(eye);
      wrap.appendChild(pwWrap);
    } else {
      wrap.appendChild(input);
    }

    if (desc) {
      const dEl = document.createElement('div');
      dEl.className = 'owui-row-desc';
      dEl.textContent = desc;
      wrap.appendChild(dEl);
    }
    return { block: wrap, input: input };
  }

  function openAccountAdminModal(tab) {
    currentOwuiTab = tab || 'account';
    $('accountAdminModal').classList.add('open');
    renderOwuiTab(currentOwuiTab);
  }

  async function renderOwuiTab(tabId) {
    currentOwuiTab = tabId;
    currentAdminSaveHandler = null;
    $('owuiContentFooter').classList.add('hidden');

    document.querySelectorAll('[data-owui-tab]').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.owuiTab === tabId);
    });

    const titleMap = {
      account: 'Account',
      sessions: 'Sessions & Snapshots',
      data: 'Data Controls',
      about: 'About',
      'admin-users': 'Users',
      'admin-groups': 'Groups',
      'admin-auth': 'Authentication',
      'admin-audit': 'Security Audit'
    };
    $('owuiActiveTitle').textContent = titleMap[tabId] || 'Settings';

    const body = $('owuiContentBody');
    body.innerHTML = '';

    if (tabId === 'account') {
      await renderOwuiAccountTab(body);
    } else if (tabId === 'sessions') {
      renderOwuiSessionsTab(body);
    } else if (tabId === 'data') {
      renderOwuiDataTab(body);
    } else if (tabId === 'about') {
      renderOwuiAboutTab(body);
    } else if (tabId === 'admin-users') {
      await renderOwuiAdminUsersTab(body);
    } else if (tabId === 'admin-groups') {
      await renderOwuiAdminGroupsTab(body);
    } else if (tabId === 'admin-auth') {
      await renderOwuiAdminAuthTab(body);
    } else if (tabId === 'admin-audit') {
      await renderOwuiAuditTab(body);
    }
  }

  async function renderOwuiAccountTab(body) {
    const user = state.currentUser;
    if (!user) return;

    const secProfile = document.createElement('div');
    secProfile.className = 'owui-section-title';
    secProfile.textContent = 'Profile Information';
    body.appendChild(secProfile);

    const fName = makeOwuiInputField('Full Name', '', user.name);
    const fEmail = makeOwuiInputField('Email Address', 'Encrypted at rest on server with AES-256-GCM.', user.email);
    body.appendChild(fName.block);
    body.appendChild(fEmail.block);

    const btnSaveProf = document.createElement('button');
    btnSaveProf.type = 'button';
    btnSaveProf.className = 'btn btn-sm btn-primary';
    btnSaveProf.textContent = 'Update Profile';
    btnSaveProf.addEventListener('click', async function () {
      try {
        const res = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: fName.input.value.trim(), email: fEmail.input.value.trim() })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'Update failed');
        state.currentUser = data.user;
        updateTopbarUserUi(data.user);
        showToast('Profile updated');
      } catch (err) {
        showToast(err.message, true);
      }
    });
    body.appendChild(btnSaveProf);

    // Password change
    const secPw = document.createElement('div');
    secPw.className = 'owui-section-title';
    secPw.textContent = 'Change Password';
    body.appendChild(secPw);

    const fCurPw = makeOwuiInputField('Current Password', '', '', { isPassword: true });
    const fNewPw = makeOwuiInputField('New Password', 'Minimum 8 characters (salted scrypt hash).', '', { isPassword: true });
    body.appendChild(fCurPw.block);
    body.appendChild(fNewPw.block);

    const btnPw = document.createElement('button');
    btnPw.type = 'button';
    btnPw.className = 'btn btn-sm btn-blue';
    btnPw.textContent = 'Update Password';
    btnPw.addEventListener('click', async function () {
      try {
        const res = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: fCurPw.input.value, newPassword: fNewPw.input.value })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'Password update failed');
        fCurPw.input.value = '';
        fNewPw.input.value = '';
        showToast('Password changed and session rotated');
      } catch (err) {
        showToast(err.message, true);
      }
    });
    body.appendChild(btnPw);

    // Two-Factor Authentication (Offline TOTP)
    const secMfa = document.createElement('div');
    secMfa.className = 'owui-section-title';
    secMfa.textContent = 'Multi-Factor Authentication (Offline TOTP)';
    body.appendChild(secMfa);

    const mfaHost = document.createElement('div');
    if (user.mfaEnabled) {
      mfaHost.innerHTML = '<div class="muted-hint" style="margin-bottom:8px;">TOTP Authenticator is <strong>enabled</strong> on your account.</div>';
      const btnDis = document.createElement('button');
      btnDis.type = 'button';
      btnDis.className = 'btn btn-sm btn-red';
      btnDis.textContent = 'Disable Authenticator';
      btnDis.addEventListener('click', async function () {
        const res = await fetch('/api/auth/mfa/disable', { method: 'POST' });
        const d = await res.json();
        if (res.ok && d.ok) {
          state.currentUser = d.user;
          showToast('TOTP disabled');
          renderOwuiTab('account');
        }
      });
      mfaHost.appendChild(btnDis);
    } else {
      const btnSetup = document.createElement('button');
      btnSetup.type = 'button';
      btnSetup.className = 'btn btn-sm';
      btnSetup.textContent = 'Set Up Authenticator Secret';
      btnSetup.addEventListener('click', async function () {
        const res = await fetch('/api/auth/mfa/setup', { method: 'POST' });
        const d = await res.json();
        if (!res.ok || !d.ok) return;
        mfaHost.innerHTML = '';
        const box = document.createElement('div');
        box.className = 'mfa-setup-card';

        const hdr = document.createElement('div');
        hdr.className = 'owui-row-title';
        hdr.textContent = 'Authenticator Setup (Scan QR or Enter Manual Key)';
        box.appendChild(hdr);

        const grid = document.createElement('div');
        grid.className = 'mfa-setup-grid';

        if (d.qrDataUrl) {
          const qrWrap = document.createElement('div');
          qrWrap.className = 'mfa-qr-card';
          const qrImg = document.createElement('img');
          qrImg.className = 'mfa-qr-img';
          qrImg.src = d.qrDataUrl;
          qrImg.alt = 'TOTP Authenticator QR Code';
          const qrCap = document.createElement('span');
          qrCap.className = 'mfa-qr-caption';
          qrCap.textContent = 'Scan in Authenticator App';
          qrWrap.appendChild(qrImg);
          qrWrap.appendChild(qrCap);
          grid.appendChild(qrWrap);
        }

        const manualPanel = document.createElement('div');
        manualPanel.className = 'mfa-manual-panel';
        const formattedSecret = d.formattedSecret || String(d.secret || '').replace(/(.{4})/g, '$1 ').trim();
        manualPanel.innerHTML =
          '<div class="owui-row-desc" style="margin:0;">Cannot scan the QR code? Enter this setup key manually in your Authenticator app (Google / Microsoft / Authy / Bitwarden):</div>' +
          '<div class="mfa-secret-row">' +
          '  <code class="mfa-secret-code">' + VLP.escapeHtml(formattedSecret) + '</code>' +
          '  <button type="button" id="btnCopyMfaSecret" class="btn btn-xs">Copy Key</button>' +
          '</div>' +
          '<div class="owui-row-desc">Type: <strong>Time-based (TOTP, 6 digits, 30s)</strong> &bull; Issuer: <strong>VLPManual</strong></div>';

        const copyKeyBtn = manualPanel.querySelector('#btnCopyMfaSecret');
        if (copyKeyBtn) {
          copyKeyBtn.addEventListener('click', async function () {
            try {
              await navigator.clipboard.writeText(d.secret || '');
              showToast('Copied Authenticator secret key');
            } catch (_ignore) {
              showToast('Secret: ' + d.secret);
            }
          });
        }

        grid.appendChild(manualPanel);
        box.appendChild(grid);

        const codeInput = document.createElement('input');
        codeInput.className = 'owui-input textarea-mono';
        codeInput.maxLength = 6;
        codeInput.inputMode = 'numeric';
        codeInput.autocomplete = 'one-time-code';
        codeInput.placeholder = 'Enter 6-digit verification code';
        codeInput.style.marginBottom = '8px';
        const verifyBtn = document.createElement('button');
        verifyBtn.type = 'button';
        verifyBtn.className = 'btn btn-sm btn-primary';
        verifyBtn.textContent = 'Verify & Enable MFA';
        verifyBtn.addEventListener('click', async function () {
          const er = await fetch('/api/auth/mfa/enable', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: codeInput.value.trim() })
          });
          const ed = await er.json();
          if (!er.ok || !ed.ok) { showToast(ed.error || 'Verification failed', true); return; }
          state.currentUser = ed.user;
          showToast('Two-Factor Authentication enabled!');
          renderOwuiTab('account');
        });
        box.appendChild(codeInput);
        box.appendChild(verifyBtn);
        mfaHost.appendChild(box);
      });
      mfaHost.appendChild(btnSetup);
    }
    body.appendChild(mfaHost);

    // Personal API Key section
    if ((state.publicConfig && state.publicConfig.enableApiKeys) || user.role === 'admin') {
      const secKey = document.createElement('div');
      secKey.className = 'owui-section-title';
      secKey.textContent = 'API Keys';
      body.appendChild(secKey);

      const keyRow = document.createElement('div');
      keyRow.style.display = 'flex';
      keyRow.style.gap = '8px';
      keyRow.style.alignItems = 'center';
      keyRow.style.flexWrap = 'wrap';

      const keyOut = document.createElement('input');
      keyOut.className = 'owui-input textarea-mono';
      keyOut.readOnly = true;
      keyOut.style.maxWidth = '380px';
      keyOut.placeholder = user.hasApiKey ? 'API key is configured (HMAC-SHA256 hashed)' : 'No API key generated yet';

      const genBtn = document.createElement('button');
      genBtn.type = 'button';
      genBtn.className = 'btn btn-sm btn-blue';
      genBtn.textContent = user.hasApiKey ? 'Rotate API Key' : 'Generate API Key';
      genBtn.addEventListener('click', async function () {
        const res = await fetch('/api/auth/api-key', { method: 'POST' });
        const d = await res.json();
        if (res.ok && d.ok) {
          keyOut.value = d.apiKey;
          state.currentUser.hasApiKey = true;
          showToast('New API key created (copy it now)');
        }
      });

      const revBtn = document.createElement('button');
      revBtn.type = 'button';
      revBtn.className = 'btn btn-sm btn-red';
      revBtn.textContent = 'Revoke';
      revBtn.addEventListener('click', async function () {
        await fetch('/api/auth/api-key', { method: 'DELETE' });
        state.currentUser.hasApiKey = false;
        keyOut.value = '';
        keyOut.placeholder = 'No API key generated yet';
        showToast('API key revoked');
      });

      keyRow.appendChild(keyOut);
      keyRow.appendChild(genBtn);
      keyRow.appendChild(revBtn);
      body.appendChild(keyRow);
    }
  }

  function renderOwuiSessionsTab(body) {
    const defaultSnapName = (state.manual && state.manual.name ? state.manual.name : 'Manual') + ' Snapshot';

    body.innerHTML =
      '<div class="card">' +
      '  <div class="card-header"><span class="card-title">Save Named Snapshot (Server /data + Browser)</span></div>' +
      '  <div style="display:flex; gap:8px; flex-wrap:wrap;">' +
      '    <input id="snapshotNameInput" class="input" type="text" style="flex:1; min-width:200px;" placeholder="e.g. Annex B Lab 01 - Checkpoint" />' +
      '    <button type="button" id="btnSaveSnapshot" class="btn btn-sm btn-primary">Save Snapshot</button>' +
      '  </div>' +
      '</div>' +
      '<div class="card">' +
      '  <div class="card-header"><span class="card-title">Portable Offline Project Backup (.json)</span></div>' +
      '  <div style="display:flex; gap:8px; flex-wrap:wrap;">' +
      '    <button type="button" id="btnExportJsonBackup" class="btn btn-sm">Download .json Backup</button>' +
      '    <label class="btn btn-sm" for="importJsonBackupInput">Restore .json Backup' +
      '      <input id="importJsonBackupInput" type="file" accept=".json" class="hidden" />' +
      '    </label>' +
      '  </div>' +
      '</div>' +
      '<div class="card">' +
      '  <div class="card-header">' +
      '    <span class="card-title">Your Private Snapshots</span>' +
      '    <button type="button" id="btnRefreshSnapshots" class="btn btn-xs">Refresh</button>' +
      '  </div>' +
      '  <div id="snapshotsList" class="muted-hint">Loading...</div>' +
      '</div>' +
      '<div class="card">' +
      '  <div class="card-header">' +
      '    <span class="card-title">Shared Team Manuals (All Active Users)</span>' +
      '    <div style="display:flex; gap:6px;">' +
      '      <button type="button" id="btnShareCurrent" class="btn btn-xs btn-blue">Share Current Manual</button>' +
      '      <button type="button" id="btnRefreshShared" class="btn btn-xs">Refresh</button>' +
      '    </div>' +
      '  </div>' +
      '  <div id="sharedSnapshotsList" class="muted-hint">Loading...</div>' +
      '</div>';

    $('snapshotNameInput').value = defaultSnapName;
    $('btnRefreshSnapshots').addEventListener('click', refreshSnapshotsList);
    $('btnRefreshShared').addEventListener('click', refreshSharedSnapshotsList);

    $('btnShareCurrent').addEventListener('click', async function () {
      const name = $('snapshotNameInput').value.trim() || (state.manual && state.manual.name) || 'Shared Manual';
      const payload = buildSerializableState();
      try {
        const res = await fetch('/api/sessions-shared', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, state: payload })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'Share failed');
        refreshSharedSnapshotsList();
        showToast('Shared manual to Team Manuals: ' + name);
      } catch (err) {
        showToast('Share failed: ' + err.message, true);
      }
    });

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
      const safeName = ((state.manual && state.manual.name) || 'vlp-project').replace(/[^a-zA-Z0-9._-]/g, '_');
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
        closeModal('accountAdminModal');
        scheduleAutosave();
        showToast('Restored project from JSON backup');
      } catch (err) {
        showToast('JSON restore failed: ' + err.message, true);
      }
    });

    refreshSnapshotsList();
    refreshSharedSnapshotsList();
  }

  function renderOwuiDataTab(body) {
    const sec = document.createElement('div');
    sec.className = 'owui-section-title';
    sec.textContent = 'Workspace Backups & Student Document Exports';
    body.appendChild(sec);

    const desc = document.createElement('p');
    desc.className = 'owui-row-desc';
    desc.textContent = 'Your autosave and named snapshots are isolated to your account directory under /data/users/.';
    body.appendChild(desc);

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '8px';
    row.style.flexWrap = 'wrap';
    row.style.marginTop = '12px';

    const bSess = document.createElement('button');
    bSess.type = 'button';
    bSess.className = 'btn btn-sm btn-blue';
    bSess.textContent = 'Manage Private & Shared Snapshots';
    bSess.addEventListener('click', function () {
      renderOwuiTab('sessions');
    });

    const bPdf = document.createElement('button');
    bPdf.type = 'button';
    bPdf.className = 'btn btn-sm btn-primary';
    bPdf.textContent = 'Export Student PDF (Full Manual)';
    bPdf.addEventListener('click', function () {
      if ($('exportScopeSelect')) $('exportScopeSelect').value = 'full';
      exportDocument('pdf', 'full');
    });

    const bZip = document.createElement('button');
    bZip.type = 'button';
    bZip.className = 'btn btn-sm';
    bZip.textContent = 'Export VLP ZIP Archive';
    bZip.addEventListener('click', exportVlpZip);

    row.appendChild(bSess);
    row.appendChild(bPdf);
    row.appendChild(bZip);
    body.appendChild(row);
  }

  async function openBugReport() {
    let baseIssueUrl = '';
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const health = await res.json();
        baseIssueUrl = (health && health.issueUrl) || '';
      }
    } catch (_ignore) {}

    if (!baseIssueUrl) {
      showToast('Bug report repository URL unavailable offline. Open GitHub Issues on an internet-connected host.', true);
      return;
    }

    const title = '[v0.3.3-beta] Bug Report: ';
    const envLines = [
      '**Version:** v0.3.3-beta',
      '**Browser Viewport:** ' + window.innerWidth + 'x' + window.innerHeight,
      '**UI Theme:** ' + state.uiTheme + ' | **Preview Theme:** ' + state.previewTheme,
      '',
      '**Steps to Reproduce:**',
      '1. ',
      '',
      '**Expected Behavior:**',
      '',
      '**Actual Behavior:**',
      ''
    ].join('\n');

    const fullUrl = baseIssueUrl + '?title=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(envLines);
    const opened = window.open(fullUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      showToast('Popup blocked — please allow popups to open GitHub Issues', true);
    }
  }

  function renderOwuiAboutTab(body) {
    body.innerHTML =
      '<div class="owui-section-title">VLP Manual HTML Formatter &amp; XML Builder (v0.3.3-beta)</div>' +
      '<p class="owui-row-desc" style="font-size:12.5px; line-height:1.55;">100% air-gapped, deterministic authoring studio supporting VLP HTML5/XML packages, Student Exports (.pdf, .html, .mdx, .rtf), and multi-user local accounts.</p>' +
      '<div style="margin:10px 0 6px;"><button type="button" id="btnAboutReportBug" class="btn btn-sm btn-blue">Report Bug on GitHub</button></div>' +
      '<div class="owui-section-title">PII &amp; Credential Security Architecture</div>' +
      '<ul style="font-size:12.5px; color:var(--app-text); line-height:1.65; padding-left:18px;">' +
      '<li><strong>Password Storage:</strong> Salted <code>scrypt</code> (32-byte random salt, N=16384, r=8, p=1) verified with constant-time <code>timingSafeEqual</code>.</li>' +
      '<li><strong>PII Encryption at Rest:</strong> Names, emails, usernames, OAuth secrets, and LDAP bind credentials encrypted on disk via <strong>AES-256-GCM</strong> with per-record random IV &amp; authentication tag.</li>' +
      '<li><strong>Blind Lookup Indexes:</strong> Email &amp; username uniqueness checked using keyed <strong>HMAC-SHA256</strong> blind indexes without exposing plaintext PII.</li>' +
      '<li><strong>Session Security:</strong> HMAC-SHA256 signed <code>HttpOnly; SameSite=Strict</code> session cookies with password/role-change session version revocation and login brute-force throttling.</li>' +
      '</ul>';
    const bugBtn = $('btnAboutReportBug');
    if (bugBtn) bugBtn.addEventListener('click', openBugReport);
  }

  async function renderOwuiAdminUsersTab(body) {
    const [uRes, gRes] = await Promise.all([fetch('/api/admin/users'), fetch('/api/admin/groups')]);
    const uJson = await uRes.json();
    const gJson = await gRes.json();
    const users = uJson.users || [];
    const groups = gJson.groups || [];

    const secNew = document.createElement('div');
    secNew.className = 'owui-section-title';
    secNew.textContent = 'Create Local User Account';
    body.appendChild(secNew);

    const grid = document.createElement('div');
    grid.className = 'owui-grid-2';
    const inName = makeOwuiInputField('Full Name', '', '', { placeholder: 'Student or Instructor Name' });
    const inEmail = makeOwuiInputField('Email', '', '', { placeholder: 'user@lab.local' });
    const inUsername = makeOwuiInputField('Username', '', '', { placeholder: 'jdoe' });
    const inPw = makeOwuiInputField('Initial Password', '', '', { isPassword: true, placeholder: 'Min 8 characters' });
    const inRole = makeOwuiSelectRow('Role', '', 'user', [
      { value: 'user', label: 'user' },
      { value: 'admin', label: 'admin' },
      { value: 'pending', label: 'pending' }
    ]);
    const groupOpts = [{ value: '', label: 'None' }].concat(groups.map(function (g) { return { value: g.id, label: g.name }; }));
    const inGrp = makeOwuiSelectRow('Group', '', '', groupOpts);

    grid.appendChild(inName.block);
    grid.appendChild(inEmail.block);
    grid.appendChild(inUsername.block);
    grid.appendChild(inPw.block);
    grid.appendChild(inRole.row);
    grid.appendChild(inGrp.row);
    body.appendChild(grid);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn-sm btn-primary';
    addBtn.textContent = '+ Create Account';
    addBtn.addEventListener('click', async function () {
      try {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: inName.input.value.trim(),
            email: inEmail.input.value.trim(),
            username: inUsername.input.value.trim(),
            password: inPw.input.value,
            role: inRole.select.value,
            groupId: inGrp.select.value
          })
        });
        const d = await res.json();
        if (!res.ok || !d.ok) throw new Error(d.error || 'Failed to create user');
        showToast('Created account: ' + d.user.username);
        renderOwuiTab('admin-users');
      } catch (err) {
        showToast(err.message, true);
      }
    });
    body.appendChild(addBtn);

    const secList = document.createElement('div');
    secList.className = 'owui-section-title';
    secList.textContent = 'Registered Accounts (' + users.length + ')';
    body.appendChild(secList);

    const table = document.createElement('table');
    table.className = 'owui-table';
    table.innerHTML = '<thead><tr><th>Name</th><th>Email / Username</th><th>Role</th><th>Group</th><th>Actions</th></tr></thead><tbody></tbody>';
    const tbody = table.querySelector('tbody');

    users.forEach(function (u) {
      const tr = document.createElement('tr');
      const tdName = document.createElement('td');
      tdName.textContent = u.name + (u.mfaEnabled ? ' [MFA]' : '');
      const tdEmail = document.createElement('td');
      tdEmail.innerHTML = '<div>' + VLP.escapeHtml(u.email) + '</div><div class="owui-row-desc">@' + VLP.escapeHtml(u.username) + '</div>';

      const tdRole = document.createElement('td');
      const rSel = document.createElement('select');
      rSel.className = 'owui-select owui-select-compact';
      ['pending', 'user', 'admin'].forEach(function (rVal) {
        const o = document.createElement('option');
        o.value = rVal;
        o.textContent = rVal;
        if (u.role === rVal) o.selected = true;
        rSel.appendChild(o);
      });
      rSel.addEventListener('change', async function () {
        const res = await fetch('/api/admin/users/' + encodeURIComponent(u.id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: rSel.value })
        });
        const d = await res.json();
        if (!res.ok || !d.ok) { showToast(d.error || 'Failed', true); renderOwuiTab('admin-users'); return; }
        showToast('Updated role for ' + u.username);
      });
      tdRole.appendChild(rSel);

      const tdGrp = document.createElement('td');
      const gSel = document.createElement('select');
      gSel.className = 'owui-select owui-select-compact';
      groupOpts.forEach(function (go) {
        const o = document.createElement('option');
        o.value = go.value;
        o.textContent = go.label;
        if (u.groupId === go.value) o.selected = true;
        gSel.appendChild(o);
      });
      gSel.addEventListener('change', async function () {
        await fetch('/api/admin/users/' + encodeURIComponent(u.id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupId: gSel.value })
        });
        showToast('Updated group assignment');
      });
      tdGrp.appendChild(gSel);

      const tdAct = document.createElement('td');
      tdAct.style.display = 'flex';
      tdAct.style.gap = '6px';
      const pwBtn = makeTinyBtn('Reset PW', async function () {
        const np = window.prompt('Enter new password (min 8 chars) for ' + u.username + ':');
        if (!np) return;
        const res = await fetch('/api/admin/users/' + encodeURIComponent(u.id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword: np })
        });
        const d = await res.json();
        if (!res.ok || !d.ok) showToast(d.error || 'Reset failed', true);
        else showToast('Password reset for ' + u.username);
      });
      tdAct.appendChild(pwBtn);

      if (u.id !== state.currentUser.id) {
        const delBtn = makeTinyBtn('Delete', async function () {
          const res = await fetch('/api/admin/users/' + encodeURIComponent(u.id), { method: 'DELETE' });
          const d = await res.json();
          if (!res.ok || !d.ok) { showToast(d.error || 'Delete failed', true); return; }
          showToast('Deleted user ' + u.username);
          renderOwuiTab('admin-users');
        });
        tdAct.appendChild(delBtn);
      }

      tr.appendChild(tdName);
      tr.appendChild(tdEmail);
      tr.appendChild(tdRole);
      tr.appendChild(tdGrp);
      tr.appendChild(tdAct);
      tbody.appendChild(tr);
    });

    body.appendChild(table);
  }

  async function renderOwuiAdminGroupsTab(body) {
    const gRes = await fetch('/api/admin/groups');
    const gJson = await gRes.json();
    const groups = gJson.groups || [];

    const sec = document.createElement('div');
    sec.className = 'owui-section-title';
    sec.textContent = 'Create Permission Group';
    body.appendChild(sec);

    const gName = makeOwuiInputField('Group Name', '', '', { placeholder: 'Instructors / Lab Cohort A' });
    const gDesc = makeOwuiInputField('Description', '', '', { placeholder: 'Optional description' });
    body.appendChild(gName.block);
    body.appendChild(gDesc.block);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn-sm btn-primary';
    addBtn.textContent = '+ Create Group';
    addBtn.addEventListener('click', async function () {
      const res = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: gName.input.value.trim(), description: gDesc.input.value.trim() })
      });
      const d = await res.json();
      if (!res.ok || !d.ok) { showToast(d.error || 'Failed', true); return; }
      showToast('Created group: ' + d.group.name);
      renderOwuiTab('admin-groups');
    });
    body.appendChild(addBtn);

    const secList = document.createElement('div');
    secList.className = 'owui-section-title';
    secList.textContent = 'Groups (' + groups.length + ')';
    body.appendChild(secList);

    if (!groups.length) {
      const hint = document.createElement('div');
      hint.className = 'owui-row-desc';
      hint.textContent = 'No custom groups defined yet.';
      body.appendChild(hint);
      return;
    }

    const table = document.createElement('table');
    table.className = 'owui-table';
    table.innerHTML = '<thead><tr><th>Name</th><th>Description</th><th>Action</th></tr></thead><tbody></tbody>';
    const tbody = table.querySelector('tbody');
    groups.forEach(function (g) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td><strong>' + VLP.escapeHtml(g.name) + '</strong></td><td class="owui-row-desc">' + VLP.escapeHtml(g.description || '-') + '</td>';
      const td = document.createElement('td');
      td.appendChild(makeTinyBtn('Delete', async function () {
        await fetch('/api/admin/groups/' + encodeURIComponent(g.id), { method: 'DELETE' });
        renderOwuiTab('admin-groups');
      }));
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
    body.appendChild(table);
  }

  async function renderOwuiAdminAuthTab(body) {
    const [cfgRes, grpRes] = await Promise.all([fetch('/api/admin/auth-config'), fetch('/api/admin/groups')]);
    const cfgJson = await cfgRes.json();
    const grpJson = await grpRes.json();
    const cfg = cfgJson.config || {};
    const groups = grpJson.groups || [];
    const groupOpts = [{ value: '', label: 'None' }].concat(groups.map(function (g) { return { value: g.id, label: g.name }; }));

    // User Access
    const s1 = document.createElement('div');
    s1.className = 'owui-section-title';
    s1.textContent = 'User Access';
    body.appendChild(s1);

    const cDefaultRole = makeOwuiSelectRow('Default User Role', 'Role assigned to new users when they create an account.', cfg.defaultUserRole || 'pending', [
      { value: 'pending', label: 'pending' },
      { value: 'user', label: 'user' },
      { value: 'admin', label: 'admin' }
    ]);
    const cDefaultGrp = makeOwuiSelectRow('Default Group', 'Group assigned to new users by default.', cfg.defaultGroupId || '', groupOpts);
    const cLoginForm = makeOwuiSwitchRow('Login Form', 'Show email and password sign-in on the login page. Set up SSO or LDAP before disabling. Disabling also blocks local sign-ups; password API access is unchanged.', cfg.enableLoginForm !== false);
    const cSignUp = makeOwuiSwitchRow('New Sign Ups', 'Allow new users to create accounts.', cfg.enableSignUp !== false);
    const cApiKeys = makeOwuiSwitchRow('API Keys', 'Allow users to create API keys for programmatic access.', Boolean(cfg.enableApiKeys));
    const cJwtExp = makeOwuiInputField('JWT Expiration', "Valid time units: 's', 'm', 'h', 'd', 'w' or '-1' for no expiration.", cfg.jwtExpiration || '4w');

    body.appendChild(cDefaultRole.row);
    body.appendChild(cDefaultGrp.row);
    body.appendChild(cLoginForm.row);
    body.appendChild(cSignUp.row);
    body.appendChild(cApiKeys.row);
    body.appendChild(cJwtExp.block);

    // Multi-Factor Authentication
    const s2 = document.createElement('div');
    s2.className = 'owui-section-title';
    s2.textContent = 'Multi-Factor Authentication';
    body.appendChild(s2);

    const cReqMfa = makeOwuiSwitchRow('Require an authenticator for all users', 'Changes sign out all devices. Users enroll on their next sign-in.', Boolean(cfg.requireMfa));
    body.appendChild(cReqMfa.row);

    // Pending Accounts
    const s3 = document.createElement('div');
    s3.className = 'owui-section-title';
    s3.textContent = 'Pending Accounts';
    body.appendChild(s3);

    const cAdminDetails = makeOwuiSwitchRow('Admin Details', 'Show admin contact details while an account waits for approval.', cfg.showAdminDetails !== false);
    const cAdminEmail = makeOwuiInputField('Admin Contact Email', 'Email shown in the pending account overlay. Leave empty to use first admin user.', cfg.adminContactEmail || '', { placeholder: 'Leave empty to use first admin user' });
    const cOverlayTitle = makeOwuiInputField('Pending User Overlay Title', 'Custom title shown while an account waits for approval.', cfg.pendingOverlayTitle || '', { placeholder: 'Enter a title for the pending user info overlay. Leave empty for default.' });
    const cOverlayContent = makeOwuiInputField('Pending User Overlay Content', 'Custom message shown while an account waits for approval.', cfg.pendingOverlayContent || '', { placeholder: 'Enter content for the pending user info overlay. Leave empty for default.' });

    body.appendChild(cAdminDetails.row);
    body.appendChild(cAdminEmail.block);
    body.appendChild(cOverlayTitle.block);
    body.appendChild(cOverlayContent.block);

    // LDAP
    const s4 = document.createElement('div');
    s4.className = 'owui-section-title';
    s4.textContent = 'LDAP';
    body.appendChild(s4);

    const cLdap = makeOwuiSwitchRow('LDAP', 'Allow users to authenticate with an LDAP directory.', Boolean(cfg.ldapEnabled));
    body.appendChild(cLdap.row);

    const ldapGrid = document.createElement('div');
    ldapGrid.className = 'owui-grid-2' + (cfg.ldapEnabled ? '' : ' hidden');
    const cLdapUrl = makeOwuiInputField('LDAP Server URL', '', cfg.ldapServerUrl || '', { placeholder: 'ldaps://ldap.example.local:636' });
    const cLdapBindDn = makeOwuiInputField('Bind DN', '', cfg.ldapBindDn || '', { placeholder: 'cn=readonly,dc=lab,dc=local' });
    const cLdapBindPw = makeOwuiInputField('Bind Password', cfg.hasLdapBindPassword ? 'Encrypted secret saved (leave blank to keep).' : '', '', { isPassword: true, placeholder: 'Enter Bind Password' });
    const cLdapBase = makeOwuiInputField('Search Base', '', cfg.ldapSearchBase || '', { placeholder: 'ou=users,dc=lab,dc=local' });
    ldapGrid.appendChild(cLdapUrl.block);
    ldapGrid.appendChild(cLdapBindDn.block);
    ldapGrid.appendChild(cLdapBindPw.block);
    ldapGrid.appendChild(cLdapBase.block);
    body.appendChild(ldapGrid);
    cLdap.input.addEventListener('change', function () {
      ldapGrid.classList.toggle('hidden', !cLdap.input.checked);
    });

    // OAuth / OIDC
    const s5 = document.createElement('div');
    s5.className = 'owui-section-title';
    s5.textContent = 'OAuth / OIDC';
    body.appendChild(s5);

    const oauthLocked = !cfg.enableOauthPersistentConfig;
    const warnBanner = document.createElement('div');
    warnBanner.className = 'owui-banner-warn' + (oauthLocked ? '' : ' hidden');
    warnBanner.innerHTML = '<span>These settings are read from environment variables and cannot be edited here while <strong>ENABLE_OAUTH_PERSISTENT_CONFIG</strong> is disabled.</span>';
    const btnUnlockOauth = document.createElement('button');
    btnUnlockOauth.type = 'button';
    btnUnlockOauth.className = 'btn btn-xs';
    btnUnlockOauth.textContent = 'Enable Persistent Config';
    warnBanner.appendChild(btnUnlockOauth);
    body.appendChild(warnBanner);

    const cOauthToggle = makeOwuiSwitchRow('OAuth / OIDC', 'Allow users to authenticate with an OAuth / OIDC provider. Save changes to apply connection settings.', Boolean(cfg.oauthEnabled), oauthLocked);
    body.appendChild(cOauthToggle.row);

    const oauthGrid = document.createElement('div');
    oauthGrid.className = 'owui-grid-2';
    const cOauthName = makeOwuiInputField('Provider Name', 'Display name shown for the OAuth provider.', cfg.oauthProviderName || 'SSO', { disabled: oauthLocked });
    const cOauthUrl = makeOwuiInputField('Provider URL', 'OpenID discovery URL for this provider.', cfg.oauthProviderUrl || '', { disabled: oauthLocked, placeholder: 'idp.example.com/.well-known/openid-configuration' });
    const cOauthClientId = makeOwuiInputField('Client ID', 'OAuth client identifier from the provider.', cfg.oauthClientId || '', { disabled: oauthLocked, placeholder: 'Enter Client ID' });
    const cOauthSecret = makeOwuiInputField('Client Secret', cfg.hasOauthClientSecret ? 'Encrypted secret stored (AES-256-GCM).' : 'OAuth client secret from the provider.', '', { isPassword: true, disabled: oauthLocked, placeholder: cfg.hasOauthClientSecret ? '(Saved encrypted — leave blank to keep)' : 'Enter Client Secret' });
    const cOauthRedir = makeOwuiInputField('Redirect URI', 'Callback URL registered with the provider.', cfg.oauthRedirectUri || '', { disabled: oauthLocked, placeholder: 'Enter Redirect URI' });
    const cOauthScopes = makeOwuiInputField('Scopes', 'OAuth scopes requested during sign-in.', cfg.oauthScopes || 'openid email profile', { disabled: oauthLocked });
    const cOauthEmailClaim = makeOwuiInputField('Email Claim', 'Claim used as the user email address.', cfg.oauthEmailClaim || 'email', { disabled: oauthLocked });
    const cOauthNameClaim = makeOwuiInputField('Username Claim', 'Claim used as the display name.', cfg.oauthUsernameClaim || 'name', { disabled: oauthLocked });
    const cOauthPicClaim = makeOwuiInputField('Picture Claim', 'Claim used as the profile picture URL.', cfg.oauthPictureClaim || 'picture', { disabled: oauthLocked });
    const cOauthSubClaim = makeOwuiInputField('Sub Claim', 'Claim used as the stable user identifier.', cfg.oauthSubClaim || 'sub', { disabled: oauthLocked });

    [cOauthName, cOauthUrl, cOauthClientId, cOauthSecret, cOauthRedir, cOauthScopes, cOauthEmailClaim, cOauthNameClaim, cOauthPicClaim, cOauthSubClaim].forEach(function (f) {
      oauthGrid.appendChild(f.block);
    });
    body.appendChild(oauthGrid);

    const cOauthSignup = makeOwuiSwitchRow('OAuth Signup', 'Allow users to create accounts through OAuth.', Boolean(cfg.oauthSignup), oauthLocked);
    const cOauthMerge = makeOwuiSwitchRow('Merge Accounts by Email', 'Link OAuth sign-ins to existing accounts with the same email.', Boolean(cfg.oauthMergeByEmail), oauthLocked);
    const cOauthAuto = makeOwuiSwitchRow('Auto Redirect', 'Send users directly to the OAuth provider from the sign-in page.', Boolean(cfg.oauthAutoRedirect), oauthLocked);
    const cOauthDomains = makeOwuiInputField('Allowed Domains', 'Email domains allowed to sign in with OAuth.', cfg.oauthAllowedDomains || '*', { disabled: oauthLocked });
    const cOauthRoleMap = makeOwuiSwitchRow('Role Mapping', 'Map OAuth claims to user roles.', Boolean(cfg.oauthRoleMapping), oauthLocked);
    const cOauthGrpMap = makeOwuiSwitchRow('Group Mapping', 'Map OAuth claims to user groups.', Boolean(cfg.oauthGroupMapping), oauthLocked);
    const cOauthUpdEmail = makeOwuiSwitchRow('Update Email', 'Refresh the account email from OAuth on sign-in.', Boolean(cfg.oauthUpdateEmail), oauthLocked);
    const cOauthUpdName = makeOwuiSwitchRow('Update Name', 'Refresh the account name from OAuth on sign-in.', Boolean(cfg.oauthUpdateName), oauthLocked);
    const cOauthUpdPic = makeOwuiSwitchRow('Update Picture', 'Refresh the account picture from OAuth on sign-in.', Boolean(cfg.oauthUpdatePicture), oauthLocked);

    body.appendChild(cOauthSignup.row);
    body.appendChild(cOauthMerge.row);
    body.appendChild(cOauthAuto.row);
    body.appendChild(cOauthDomains.block);
    body.appendChild(cOauthRoleMap.row);
    body.appendChild(cOauthGrpMap.row);
    body.appendChild(cOauthUpdEmail.row);
    body.appendChild(cOauthUpdName.row);
    body.appendChild(cOauthUpdPic.row);

    let persistentEnabledFlag = Boolean(cfg.enableOauthPersistentConfig);
    btnUnlockOauth.addEventListener('click', function () {
      persistentEnabledFlag = true;
      warnBanner.classList.add('hidden');
      [cOauthToggle.input, cOauthName.input, cOauthUrl.input, cOauthClientId.input, cOauthSecret.input, cOauthRedir.input, cOauthScopes.input, cOauthEmailClaim.input, cOauthNameClaim.input, cOauthPicClaim.input, cOauthSubClaim.input, cOauthSignup.input, cOauthMerge.input, cOauthAuto.input, cOauthDomains.input, cOauthRoleMap.input, cOauthGrpMap.input, cOauthUpdEmail.input, cOauthUpdName.input, cOauthUpdPic.input].forEach(function (el) {
        el.disabled = false;
      });
      showToast('Persistent OAuth configuration unlocked (click Save to persist)');
    });

    $('owuiContentFooter').classList.remove('hidden');
    currentAdminSaveHandler = async function () {
      const payload = {
        defaultUserRole: cDefaultRole.select.value,
        defaultGroupId: cDefaultGrp.select.value,
        enableLoginForm: cLoginForm.input.checked,
        enableSignUp: cSignUp.input.checked,
        enableApiKeys: cApiKeys.input.checked,
        jwtExpiration: cJwtExp.input.value.trim() || '4w',
        requireMfa: cReqMfa.input.checked,
        showAdminDetails: cAdminDetails.input.checked,
        adminContactEmail: cAdminEmail.input.value.trim(),
        pendingOverlayTitle: cOverlayTitle.input.value,
        pendingOverlayContent: cOverlayContent.input.value,
        ldapEnabled: cLdap.input.checked,
        ldapServerUrl: cLdapUrl.input.value.trim(),
        ldapBindDn: cLdapBindDn.input.value.trim(),
        ldapBindPassword: cLdapBindPw.input.value,
        ldapSearchBase: cLdapBase.input.value.trim(),
        enableOauthPersistentConfig: persistentEnabledFlag,
        oauthEnabled: cOauthToggle.input.checked,
        oauthProviderName: cOauthName.input.value.trim(),
        oauthProviderUrl: cOauthUrl.input.value.trim(),
        oauthClientId: cOauthClientId.input.value.trim(),
        oauthClientSecret: cOauthSecret.input.value,
        oauthRedirectUri: cOauthRedir.input.value.trim(),
        oauthScopes: cOauthScopes.input.value.trim(),
        oauthEmailClaim: cOauthEmailClaim.input.value.trim(),
        oauthUsernameClaim: cOauthNameClaim.input.value.trim(),
        oauthPictureClaim: cOauthPicClaim.input.value.trim(),
        oauthSubClaim: cOauthSubClaim.input.value.trim(),
        oauthSignup: cOauthSignup.input.checked,
        oauthMergeByEmail: cOauthMerge.input.checked,
        oauthAutoRedirect: cOauthAuto.input.checked,
        oauthAllowedDomains: cOauthDomains.input.value.trim(),
        oauthRoleMapping: cOauthRoleMap.input.checked,
        oauthGroupMapping: cOauthGrpMap.input.checked,
        oauthUpdateEmail: cOauthUpdEmail.input.checked,
        oauthUpdateName: cOauthUpdName.input.checked,
        oauthUpdatePicture: cOauthUpdPic.input.checked
      };
      const res = await fetch('/api/admin/auth-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showToast(data.error || 'Failed to save Authentication settings', true);
        return;
      }
      showToast('Authentication settings saved securely');
      const stRes = await fetch('/api/auth/status');
      const stJson = await stRes.json();
      if (stJson && stJson.publicConfig) state.publicConfig = stJson.publicConfig;
    };
  }

  async function renderOwuiAuditTab(body) {
    const res = await fetch('/api/admin/audit');
    const json = await res.json();
    const events = json.events || [];
    const hint = document.createElement('p');
    hint.className = 'owui-row-desc';
    hint.textContent = 'Sanitized security events (user IDs & actions only — zero plaintext PII or credentials logged).';
    body.appendChild(hint);

    const table = document.createElement('table');
    table.className = 'owui-table';
    table.innerHTML = '<thead><tr><th>Timestamp</th><th>Event</th><th>Actor ID</th><th>Detail</th></tr></thead><tbody></tbody>';
    const tbody = table.querySelector('tbody');
    events.slice(0, 50).forEach(function (ev) {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="owui-row-desc">' + VLP.escapeHtml((ev.timestamp || '').replace('T', ' ').slice(0, 19)) + '</td>' +
        '<td><strong>' + VLP.escapeHtml(ev.event) + '</strong></td>' +
        '<td class="owui-row-desc">' + VLP.escapeHtml(String(ev.actorId || '').slice(0, 14)) + '</td>' +
        '<td class="owui-row-desc">' + VLP.escapeHtml(ev.detail || '') + '</td>';
      tbody.appendChild(tr);
    });
    body.appendChild(table);
  }

  function bindAuthAndAdminEvents() {
    $('btnToggleAuthPw').addEventListener('click', function () {
      const pw = $('authPasswordInput');
      pw.type = pw.type === 'password' ? 'text' : 'password';
    });

    $('btnToggleAuthMode').addEventListener('click', function () {
      configureAuthGateView(currentAuthMode === 'signup' ? 'login' : 'signup', state.publicConfig);
    });

    $('btnPendingRefresh').addEventListener('click', async function () {
      await checkAuthAndLoadWorkspace();
    });

    $('btnPendingSignOut').addEventListener('click', async function () {
      await fetch('/api/auth/logout', { method: 'POST' });
      state.currentUser = null;
      state.authLocked = true;
      updateTopbarUserUi(null);
      await checkAuthAndLoadWorkspace();
    });

    $('authGateForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      setAuthError('');
      const isSignup = currentAuthMode === 'setup' || currentAuthMode === 'signup';
      try {
        if (isSignup) {
          const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: $('authNameInput').value.trim(),
              email: $('authEmailInput').value.trim(),
              username: $('authUsernameInput').value.trim(),
              password: $('authPasswordInput').value
            })
          });
          const data = await res.json();
          if (!res.ok || !data.ok) throw new Error(data.error || 'Account creation failed');
          $('authPasswordInput').value = '';
          await checkAuthAndLoadWorkspace();
          showToast(currentAuthMode === 'setup' ? 'Administrator account created!' : 'Account created!');
        } else {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              identifier: $('authIdentifierInput').value.trim(),
              password: $('authPasswordInput').value,
              totpCode: $('authTotpInput').value.trim()
            })
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            if (data.mfaRequired) $('authMfaField').classList.remove('hidden');
            throw new Error(data.error || 'Sign-in failed');
          }
          $('authPasswordInput').value = '';
          await checkAuthAndLoadWorkspace();
          showToast('Signed in');
        }
      } catch (err) {
        setAuthError(err.message);
      }
    });

    $('owuiNavSearch').addEventListener('input', function () {
      const q = $('owuiNavSearch').value.trim().toLowerCase();
      document.querySelectorAll('[data-owui-tab]').forEach(function (btn) {
        btn.classList.toggle('hidden', Boolean(q && !btn.textContent.toLowerCase().includes(q)));
      });
    });

    document.querySelectorAll('[data-owui-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        renderOwuiTab(btn.dataset.owuiTab);
      });
    });

    $('btnSignOut').addEventListener('click', async function () {
      await fetch('/api/auth/logout', { method: 'POST' });
      closeModal('accountAdminModal');
      state.currentUser = null;
      state.authLocked = true;
      state.manual = null;
      updateTopbarUserUi(null);
      await checkAuthAndLoadWorkspace();
      showToast('Signed out');
    });

    $('btnOwuiSaveFooter').addEventListener('click', function () {
      if (typeof currentAdminSaveHandler === 'function') {
        currentAdminSaveHandler();
      }
    });
  }

  async function loadUserWorkspace() {
    state.authLocked = false;
    state.undoStack = [];
    state.redoStack = [];
    updateUndoRedoButtons();
    await preloadBundledSvgAssets();

    let browserSaved = null;
    let serverSaved = null;
    const slotKey = getUserAutosaveKey();

    try {
      const idbRec = await idbGet(slotKey);
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

  async function checkAuthAndLoadWorkspace() {
    try {
      const res = await fetch('/api/auth/status');
      const status = await res.json();
      state.publicConfig = status.publicConfig || {};
      state.authNeedsSetup = Boolean(status.needsSetup);
      state.currentUser = status.user || null;
      updateTopbarUserUi(state.currentUser);

      if (status.needsSetup) {
        state.authLocked = true;
        $('authGateOverlay').classList.add('open');
        configureAuthGateView('setup', state.publicConfig);
        return;
      }
      if (!status.authenticated || !status.user) {
        state.authLocked = true;
        $('authGateOverlay').classList.add('open');
        configureAuthGateView('login', state.publicConfig);
        return;
      }
      if (status.user.role === 'pending') {
        state.authLocked = true;
        $('authGateOverlay').classList.add('open');
        configureAuthGateView('pending', state.publicConfig);
        return;
      }

      $('authGateOverlay').classList.remove('open');
      await loadUserWorkspace();
      if (state.publicConfig && state.publicConfig.requireMfa && !status.user.mfaEnabled) {
        openAccountAdminModal('account');
        showToast('Administrator requires enabling an Authenticator (TOTP) under Multi-Factor Authentication', true);
      }
    } catch (_err) {
      // Offline fallback without API server: allow local client-only workspace
      $('authGateOverlay').classList.remove('open');
      await loadUserWorkspace();
    }
  }

  // =========================================================================
  // Initialization
  // =========================================================================
  async function init() {
    applyUiTheme(state.uiTheme, { syncPreview: false });
    setMobilePane(state.mobilePane);
    bindEvents();
    await checkAuthAndLoadWorkspace();
  }

  init();
})();
