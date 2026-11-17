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
const USERS_DATA_DIR = path.join(DATA_DIR, 'users');
const SHARED_SESSIONS_DIR = path.join(DATA_DIR, 'shared-sessions');
const IMAGES_DIR = path.join(DATA_DIR, 'images');
const AUTOSAVE_FILE = path.join(SESSIONS_DIR, 'autosave.json');

const SECRET_KEY_FILE = path.join(DATA_DIR, '.secret_key');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const GROUPS_FILE = path.join(DATA_DIR, 'groups.json');
const AUTH_CONFIG_FILE = path.join(DATA_DIR, 'auth-config.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit-log.json');

fs.mkdirSync(SESSIONS_DIR, { recursive: true });
fs.mkdirSync(USERS_DATA_DIR, { recursive: true });
fs.mkdirSync(SHARED_SESSIONS_DIR, { recursive: true });
fs.mkdirSync(IMAGES_DIR, { recursive: true });

/* =========================================================================
 * Cryptographic Master Key, PII Encryption (AES-256-GCM) & Password Hashing
 * ========================================================================= */
function loadOrCreateMasterKey() {
  if (process.env.APP_SECRET_KEY && String(process.env.APP_SECRET_KEY).trim()) {
    return crypto.createHash('sha256').update(String(process.env.APP_SECRET_KEY).trim(), 'utf8').digest();
  }
  if (fs.existsSync(SECRET_KEY_FILE)) {
    const rawHex = fs.readFileSync(SECRET_KEY_FILE, 'utf8').trim();
    if (/^[0-9a-fA-F]{64}$/.test(rawHex)) {
      return Buffer.from(rawHex, 'hex');
    }
  }
  const key = crypto.randomBytes(32);
  fs.writeFileSync(SECRET_KEY_FILE, key.toString('hex'), { encoding: 'utf8', mode: 0o600 });
  try { fs.chmodSync(SECRET_KEY_FILE, 0o600); } catch (_ignore) {}
  return key;
}

const MASTER_KEY = loadOrCreateMasterKey();
const PII_AAD = Buffer.from('vlp-pii-v1', 'utf8');

function encryptPii(plaintext) {
  if (plaintext == null || plaintext === '') return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);
  cipher.setAAD(PII_AAD);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return 'enc:v1:' + iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptPii(payload) {
  if (!payload || typeof payload !== 'string') return '';
  if (!payload.startsWith('enc:v1:')) return '';
  try {
    const parts = payload.split(':');
    if (parts.length !== 5) return '';
    const iv = Buffer.from(parts[2], 'hex');
    const tag = Buffer.from(parts[3], 'hex');
    const enc = Buffer.from(parts[4], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, iv);
    decipher.setAAD(PII_AAD);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  } catch (_err) {
    return '';
  }
}

function blindIndex(value) {
  return crypto.createHmac('sha256', MASTER_KEY)
    .update('idx:' + String(value || '').trim().toLowerCase(), 'utf8')
    .digest('hex');
}

function hashPassword(password) {
  const pw = String(password || '');
  const salt = crypto.randomBytes(32);
  const derived = crypto.scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return 'scrypt$' + salt.toString('hex') + '$' + derived.toString('hex');
}

function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  try {
    const salt = Buffer.from(parts[1], 'hex');
    const expected = Buffer.from(parts[2], 'hex');
    if (salt.length !== 32 || expected.length !== 64) return false;
    const actual = crypto.scryptSync(String(password || ''), salt, 64, { N: 16384, r: 8, p: 1 });
    return crypto.timingSafeEqual(actual, expected);
  } catch (_err) {
    return false;
  }
}

function hashApiKey(rawKey) {
  return crypto.createHmac('sha256', MASTER_KEY).update('apikey:' + String(rawKey || ''), 'utf8').digest('hex');
}

/* =========================================================================
 * Offline RFC 6238 TOTP Multi-Factor Authentication Helpers
 * ========================================================================= */
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function generateBase32Secret(byteLen) {
  const bytes = crypto.randomBytes(byteLen || 20);
  let bits = 0;
  let value = 0;
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function decodeBase32(str) {
  const clean = String(str || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function computeTotpCode(secretBase32, counter) {
  const key = decodeBase32(secretBase32);
  const msg = Buffer.alloc(8);
  msg.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  msg.writeUInt32BE(counter >>> 0, 4);
  const hmac = crypto.createHmac('sha1', key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(bin % 1000000).padStart(6, '0');
}

function verifyTotpCode(secretBase32, code) {
  const clean = String(code || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean) || !secretBase32) return false;
  const step = Math.floor(Date.now() / 30000);
  const codeBuf = Buffer.from(clean, 'utf8');
  for (let w = -1; w <= 1; w++) {
    const expected = Buffer.from(computeTotpCode(secretBase32, step + w), 'utf8');
    if (crypto.timingSafeEqual(codeBuf, expected)) return true;
  }
  return false;
}

/* =========================================================================
 * Duration Parsing, Signed Session Tokens & Cookies
 * ========================================================================= */
function parseDurationMs(expr) {
  const s = String(expr || '4w').trim().toLowerCase();
  if (s === '-1') return 10 * 365 * 24 * 60 * 60 * 1000;
  const m = s.match(/^(\d+)\s*([smhdw])$/);
  if (!m) return 28 * 24 * 60 * 60 * 1000;
  const n = Number(m[1]);
  const mult = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000
  }[m[2]];
  return Math.max(60 * 1000, n * mult);
}

function toBase64Url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(input) {
  const padded = String(input || '').replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded, 'base64');
}

function signSessionToken(user, durationExpr) {
  const now = Date.now();
  const ttlMs = parseDurationMs(durationExpr);
  const headerB64 = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'VLP' }));
  const payloadB64 = toBase64Url(JSON.stringify({
    sub: user.id,
    role: user.role,
    sv: user.sessionVersion || 1,
    iat: now,
    exp: now + ttlMs
  }));
  const signingInput = headerB64 + '.' + payloadB64;
  const sigB64 = toBase64Url(crypto.createHmac('sha256', MASTER_KEY).update(signingInput).digest());
  return { token: signingInput + '.' + sigB64, maxAgeSec: Math.floor(ttlMs / 1000) };
}

function verifyTokenSignature(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const signingInput = parts[0] + '.' + parts[1];
  const expectedSig = toBase64Url(crypto.createHmac('sha256', MASTER_KEY).update(signingInput).digest());
  try {
    const a = Buffer.from(parts[2], 'utf8');
    const b = Buffer.from(expectedSig, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(fromBase64Url(parts[1]).toString('utf8'));
    if (!payload || !payload.sub || typeof payload.exp !== 'number' || payload.exp <= Date.now()) {
      return null;
    }
    return payload;
  } catch (_err) {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers && req.headers.cookie;
  const out = {};
  if (!header) return out;
  String(header).split(';').forEach(function (pair) {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    if (k) {
      try { out[k] = decodeURIComponent(v); } catch (_e) { out[k] = v; }
    }
  });
  return out;
}

function setSessionCookie(req, res, token, maxAgeSec) {
  const isHttps = Boolean(req.secure || req.headers['x-forwarded-proto'] === 'https');
  const attrs = [
    'vlp_session=' + encodeURIComponent(token),
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=' + String(Math.max(0, maxAgeSec || 0))
  ];
  if (isHttps) attrs.push('Secure');
  res.setHeader('Set-Cookie', attrs.join('; '));
}

function clearSessionCookie(req, res) {
  const isHttps = Boolean(req.secure || req.headers['x-forwarded-proto'] === 'https');
  const attrs = ['vlp_session=', 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0'];
  if (isHttps) attrs.push('Secure');
  res.setHeader('Set-Cookie', attrs.join('; '));
}

/* =========================================================================
 * File Utilities & Persistent Auth/Group/Config Stores
 * ========================================================================= */
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
  const suffix = '.' + process.pid + '.' + crypto.randomBytes(4).toString('hex') + '.tmp';
  const tmpPath = filePath + suffix;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(tmpPath, filePath);
}

function readJsonSafe(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_err) {
    return null;
  }
}

function listDirFilesSafe(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(function (f) {
    const full = path.join(dir, f);
    return fs.statSync(full).isFile();
  });
}

function defaultAuthConfig() {
  return {
    defaultUserRole: 'pending',
    defaultGroupId: '',
    enableLoginForm: true,
    enableSignUp: true,
    enableApiKeys: false,
    jwtExpiration: '4w',
    requireMfa: false,
    showAdminDetails: true,
    adminContactEmail: '',
    pendingOverlayTitle: '',
    pendingOverlayContent: '',
    ldapEnabled: false,
    ldapServerUrl: '',
    ldapBindDn: '',
    ldapBindPasswordEnc: '',
    ldapSearchBase: '',
    ldapSearchAttr: 'mail',
    enableOauthPersistentConfig: process.env.ENABLE_OAUTH_PERSISTENT_CONFIG === 'true',
    oauthEnabled: false,
    oauthProviderName: 'SSO',
    oauthProviderUrl: 'https://accounts.google.com/.well-known/openid-configuration',
    oauthClientId: '',
    oauthClientSecretEnc: '',
    oauthRedirectUri: '',
    oauthScopes: 'openid email profile',
    oauthEmailClaim: 'email',
    oauthUsernameClaim: 'name',
    oauthPictureClaim: 'picture',
    oauthSubClaim: 'sub',
    oauthSignup: false,
    oauthMergeByEmail: false,
    oauthAutoRedirect: false,
    oauthAllowedDomains: '*',
    oauthRoleMapping: false,
    oauthGroupMapping: false,
    oauthUpdateEmail: false,
    oauthUpdateName: false,
    oauthUpdatePicture: false
  };
}

function loadAuthConfig() {
  const stored = readJsonSafe(AUTH_CONFIG_FILE);
  return Object.assign(defaultAuthConfig(), stored || {});
}

function saveAuthConfig(cfg) {
  atomicWriteJson(AUTH_CONFIG_FILE, cfg);
}

function getSafeAuthConfigForAdmin(cfg) {
  const copy = Object.assign({}, cfg);
  copy.hasOauthClientSecret = Boolean(cfg.oauthClientSecretEnc);
  copy.oauthClientSecret = '';
  delete copy.oauthClientSecretEnc;
  copy.hasLdapBindPassword = Boolean(cfg.ldapBindPasswordEnc);
  copy.ldapBindPassword = '';
  delete copy.ldapBindPasswordEnc;
  return copy;
}

function getPublicAuthConfig(cfg, users) {
  let contactEmail = cfg.adminContactEmail || '';
  if (!contactEmail && cfg.showAdminDetails && Array.isArray(users)) {
    const firstAdmin = users.find(function (u) { return u.role === 'admin'; });
    if (firstAdmin) contactEmail = decryptPii(firstAdmin.emailEnc);
  }
  return {
    defaultUserRole: cfg.defaultUserRole,
    enableLoginForm: Boolean(cfg.enableLoginForm),
    enableSignUp: Boolean(cfg.enableSignUp),
    enableApiKeys: Boolean(cfg.enableApiKeys),
    requireMfa: Boolean(cfg.requireMfa),
    showAdminDetails: Boolean(cfg.showAdminDetails),
    adminContactEmail: cfg.showAdminDetails ? contactEmail : '',
    pendingOverlayTitle: cfg.pendingOverlayTitle || '',
    pendingOverlayContent: cfg.pendingOverlayContent || '',
    ldapEnabled: Boolean(cfg.ldapEnabled),
    oauthEnabled: Boolean(cfg.oauthEnabled),
    oauthProviderName: cfg.oauthProviderName || 'SSO'
  };
}

function loadUsers() {
  const data = readJsonSafe(USERS_FILE);
  return Array.isArray(data) ? data : [];
}

function saveUsers(users) {
  atomicWriteJson(USERS_FILE, users);
}

function loadGroups() {
  const data = readJsonSafe(GROUPS_FILE);
  return Array.isArray(data) ? data : [];
}

function saveGroups(groups) {
  atomicWriteJson(GROUPS_FILE, groups);
}

function appendAuditEvent(eventType, actorId, targetId, detail) {
  const list = readJsonSafe(AUDIT_FILE);
  const events = Array.isArray(list) ? list : [];
  events.unshift({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    event: String(eventType || 'INFO'),
    actorId: actorId || 'system',
    targetId: targetId || '',
    detail: String(detail || '')
  });
  if (events.length > 200) events.length = 200;
  try { atomicWriteJson(AUDIT_FILE, events); } catch (_ignore) {}
}

function sanitizeUserView(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: decryptPii(user.nameEnc),
    email: decryptPii(user.emailEnc),
    username: decryptPii(user.usernameEnc),
    role: user.role || 'pending',
    groupId: user.groupId || '',
    hasApiKey: Boolean(user.apiKeyHash),
    mfaEnabled: Boolean(user.mfaEnabled && user.mfaSecretEnc),
    createdAt: user.createdAt || '',
    lastActiveAt: user.lastActiveAt || ''
  };
}

function bootstrapAdminFromEnvIfNeeded() {
  const users = loadUsers();
  if (users.length > 0) return;
  const email = process.env.ADMIN_EMAIL && String(process.env.ADMIN_EMAIL).trim();
  const password = process.env.ADMIN_PASSWORD && String(process.env.ADMIN_PASSWORD);
  if (!email || !password || password.length < 8) return;

  const username = (process.env.ADMIN_USERNAME && String(process.env.ADMIN_USERNAME).trim()) || email.split('@')[0] || 'admin';
  const name = (process.env.ADMIN_NAME && String(process.env.ADMIN_NAME).trim()) || 'Administrator';
  const adminUser = {
    id: crypto.randomUUID(),
    nameEnc: encryptPii(name),
    emailEnc: encryptPii(email.toLowerCase()),
    usernameEnc: encryptPii(username.toLowerCase()),
    emailIndex: blindIndex(email),
    usernameIndex: blindIndex(username),
    passwordHash: hashPassword(password),
    role: 'admin',
    groupId: '',
    apiKeyHash: '',
    mfaEnabled: false,
    mfaSecretEnc: '',
    sessionVersion: 1,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString()
  };
  saveUsers([adminUser]);
  appendAuditEvent('ADMIN_ENV_BOOTSTRAP', 'system', adminUser.id, 'Bootstrapped initial admin from environment variables');
}

bootstrapAdminFromEnvIfNeeded();

/* =========================================================================
 * Login Rate Limiter (Memory-Backed Brute-Force Protection)
 * ========================================================================= */
const loginAttempts = new Map();
const MAX_LOGIN_FAILS = 8;
const LOCK_WINDOW_MS = 15 * 60 * 1000;
const LOCK_DURATION_MS = 5 * 60 * 1000;

function checkLoginRateLimit(key) {
  const rec = loginAttempts.get(key);
  if (!rec) return { blocked: false };
  const now = Date.now();
  if (rec.lockedUntil && rec.lockedUntil > now) {
    return { blocked: true, retryAfterSec: Math.ceil((rec.lockedUntil - now) / 1000) };
  }
  if (now - rec.firstAttemptAt > LOCK_WINDOW_MS) {
    loginAttempts.delete(key);
    return { blocked: false };
  }
  return { blocked: false };
}

function recordLoginFailure(key) {
  const now = Date.now();
  let rec = loginAttempts.get(key);
  if (!rec || now - rec.firstAttemptAt > LOCK_WINDOW_MS) {
    rec = { count: 0, firstAttemptAt: now, lockedUntil: 0 };
  }
  rec.count += 1;
  if (rec.count >= MAX_LOGIN_FAILS) {
    rec.lockedUntil = now + LOCK_DURATION_MS;
  }
  loginAttempts.set(key, rec);
}

function clearLoginFailure(key) {
  loginAttempts.delete(key);
}

/* =========================================================================
 * Middleware: Security Headers, Request Parsing, Authentication
 * ========================================================================= */
app.use(function (req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});

app.use(express.json({ limit: '64mb' }));
app.use(express.raw({ type: ['application/zip', 'application/octet-stream'], limit: '100mb' }));

// Attach req.user & req.authState on every request
app.use(function (req, _res, next) {
  const users = loadUsers();
  const cfg = loadAuthConfig();
  req.authConfig = cfg;
  req.usersList = users;
  req.user = null;

  const cookies = parseCookies(req);
  let token = cookies.vlp_session || '';
  const authHeader = String(req.headers.authorization || '');
  if (!token && authHeader.startsWith('Bearer ')) {
    const bearerVal = authHeader.slice(7).trim();
    if (bearerVal.startsWith('vlp_sk_')) {
      const kHash = hashApiKey(bearerVal);
      const matched = users.find(function (u) {
        return u.apiKeyHash && u.apiKeyHash === kHash && (cfg.enableApiKeys || u.role === 'admin');
      });
      if (matched) req.user = matched;
      return next();
    }
    token = bearerVal;
  }

  if (token) {
    const payload = verifyTokenSignature(token);
    if (payload) {
      const matched = users.find(function (u) { return u.id === payload.sub; });
      if (matched && (matched.sessionVersion || 1) === payload.sv) {
        req.user = matched;
      }
    }
  }
  next();
});

function requireActiveUser(req, res, next) {
  // Preserve pre-bootstrap behavior when zero accounts have been registered (e.g. initial setup or clean CI tests)
  if (req.usersList.length === 0) return next();
  if (!req.user) {
    return res.status(401).json({ ok: false, error: 'Authentication required' });
  }
  if (req.user.role === 'pending') {
    return res.status(403).json({ ok: false, error: 'Account pending administrator approval' });
  }
  return next();
}

function requireSignedInUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ ok: false, error: 'Authentication required' });
  }
  return next();
}

function requireAdminUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ ok: false, error: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'Administrator privileges required' });
  }
  return next();
}

function getUserSessionsDir(req) {
  if (!req.user) return SESSIONS_DIR;
  const userDir = path.join(USERS_DATA_DIR, sanitizeId(req.user.id), 'sessions');
  fs.mkdirSync(userDir, { recursive: true });
  return userDir;
}

// Static application & bundled offline assets (zero CDNs)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/samples/annexb/images', express.static(path.join(__dirname, 'dsac.annexb.lab01-en', 'images')));
app.use('/samples/annexc/images', express.static(path.join(__dirname, 'dsac.annexc.lab01-en', 'images')));

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

/* =========================================================================
 * Health Check
 * ========================================================================= */
app.get('/api/health', function (_req, res) {
  res.json({
    ok: true,
    version: '0.3.1-beta',
    port: PORT,
    dataDir: DATA_DIR,
    airGapped: true,
    uptimeSeconds: Math.floor(process.uptime())
  });
});

/* =========================================================================
 * Authentication & Account Routes
 * ========================================================================= */
app.get('/api/auth/status', function (req, res) {
  const users = req.usersList;
  const cfg = req.authConfig;
  res.json({
    ok: true,
    needsSetup: users.length === 0,
    authenticated: Boolean(req.user),
    user: req.user ? sanitizeUserView(req.user) : null,
    publicConfig: getPublicAuthConfig(cfg, users)
  });
});

app.post('/api/auth/signup', function (req, res) {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const usernameInput = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!name || name.length > 100) {
    return res.status(400).json({ ok: false, error: 'Name is required (max 100 chars)' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
    return res.status(400).json({ ok: false, error: 'Valid email address is required' });
  }
  const username = (usernameInput || email.split('@')[0]).replace(/[^a-z0-9._-]/g, '');
  if (!username || username.length < 2 || username.length > 48) {
    return res.status(400).json({ ok: false, error: 'Username must be 2-48 alphanumeric/._- characters' });
  }
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ ok: false, error: 'Password must be between 8 and 128 characters' });
  }

  const users = loadUsers();
  const cfg = loadAuthConfig();
  const isFirstUser = users.length === 0;

  if (!isFirstUser && (!cfg.enableSignUp || !cfg.enableLoginForm)) {
    return res.status(403).json({ ok: false, error: 'New sign-ups are currently disabled by the administrator' });
  }

  const eIdx = blindIndex(email);
  const uIdx = blindIndex(username);
  if (users.some(function (u) { return u.emailIndex === eIdx; })) {
    return res.status(409).json({ ok: false, error: 'An account with this email already exists' });
  }
  if (users.some(function (u) { return u.usernameIndex === uIdx; })) {
    return res.status(409).json({ ok: false, error: 'This username is already taken' });
  }

  const role = isFirstUser ? 'admin' : (cfg.defaultUserRole || 'pending');
  const newUser = {
    id: crypto.randomUUID(),
    nameEnc: encryptPii(name),
    emailEnc: encryptPii(email),
    usernameEnc: encryptPii(username),
    emailIndex: eIdx,
    usernameIndex: uIdx,
    passwordHash: hashPassword(password),
    role: role,
    groupId: isFirstUser ? '' : (cfg.defaultGroupId || ''),
    apiKeyHash: '',
    mfaEnabled: false,
    mfaSecretEnc: '',
    sessionVersion: 1,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);
  appendAuditEvent(isFirstUser ? 'ADMIN_BOOTSTRAP' : 'USER_SIGNUP', newUser.id, newUser.id, 'Role assigned: ' + role);

  const signed = signSessionToken(newUser, cfg.jwtExpiration);
  setSessionCookie(req, res, signed.token, signed.maxAgeSec);
  res.status(201).json({
    ok: true,
    token: signed.token,
    user: sanitizeUserView(newUser),
    publicConfig: getPublicAuthConfig(cfg, users)
  });
});

app.post('/api/auth/login', function (req, res) {
  const body = req.body || {};
  const identifier = String(body.identifier || body.email || body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  const totpCode = String(body.totpCode || '').trim();
  const cfg = loadAuthConfig();

  if (!cfg.enableLoginForm) {
    return res.status(403).json({ ok: false, error: 'Local password login is disabled by administrator' });
  }
  if (!identifier || !password || password.length > 128) {
    return res.status(400).json({ ok: false, error: 'Email/username and password are required' });
  }

  const clientIp = req.ip || (req.socket && req.socket.remoteAddress) || 'local';
  const rateKey = blindIndex(clientIp + '|' + identifier);
  const limitStatus = checkLoginRateLimit(rateKey);
  if (limitStatus.blocked) {
    res.setHeader('Retry-After', String(limitStatus.retryAfterSec));
    return res.status(429).json({ ok: false, error: 'Too many failed login attempts. Try again shortly.' });
  }

  const users = loadUsers();
  const idIdx = blindIndex(identifier);
  const matchedIdx = users.findIndex(function (u) {
    return u.emailIndex === idIdx || u.usernameIndex === idIdx;
  });
  const matched = matchedIdx !== -1 ? users[matchedIdx] : null;

  if (!matched || !verifyPassword(password, matched.passwordHash)) {
    recordLoginFailure(rateKey);
    appendAuditEvent('LOGIN_FAILED', matched ? matched.id : 'anonymous', matched ? matched.id : '', 'Invalid credentials');
    return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  }

  if (matched.mfaEnabled && matched.mfaSecretEnc) {
    const secret = decryptPii(matched.mfaSecretEnc);
    if (!totpCode) {
      return res.status(403).json({ ok: false, mfaRequired: true, error: 'Authenticator 6-digit code required' });
    }
    if (!verifyTotpCode(secret, totpCode)) {
      recordLoginFailure(rateKey);
      appendAuditEvent('MFA_FAILED', matched.id, matched.id, 'Invalid TOTP code');
      return res.status(401).json({ ok: false, mfaRequired: true, error: 'Invalid authenticator code' });
    }
  }

  clearLoginFailure(rateKey);
  users[matchedIdx].lastActiveAt = new Date().toISOString();
  saveUsers(users);
  appendAuditEvent('LOGIN_SUCCESS', matched.id, matched.id, 'Role: ' + matched.role);

  const signed = signSessionToken(users[matchedIdx], cfg.jwtExpiration);
  setSessionCookie(req, res, signed.token, signed.maxAgeSec);
  res.json({
    ok: true,
    token: signed.token,
    user: sanitizeUserView(users[matchedIdx]),
    publicConfig: getPublicAuthConfig(cfg, users)
  });
});

app.post('/api/auth/logout', function (req, res) {
  if (req.user) appendAuditEvent('LOGOUT', req.user.id, req.user.id, 'User signed out');
  clearSessionCookie(req, res);
  res.json({ ok: true });
});

app.put('/api/auth/profile', requireSignedInUser, function (req, res) {
  const body = req.body || {};
  const users = loadUsers();
  const idx = users.findIndex(function (u) { return u.id === req.user.id; });
  if (idx === -1) return res.status(404).json({ ok: false, error: 'User not found' });

  const user = users[idx];
  let rotateSession = false;

  if (body.name != null) {
    const name = String(body.name).trim();
    if (!name || name.length > 100) return res.status(400).json({ ok: false, error: 'Valid name required' });
    user.nameEnc = encryptPii(name);
  }
  if (body.email != null) {
    const email = String(body.email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ ok: false, error: 'Valid email required' });
    const eIdx = blindIndex(email);
    if (users.some(function (u, ui) { return ui !== idx && u.emailIndex === eIdx; })) {
      return res.status(409).json({ ok: false, error: 'Email already in use' });
    }
    user.emailEnc = encryptPii(email);
    user.emailIndex = eIdx;
  }
  if (body.newPassword) {
    const curPw = String(body.currentPassword || '');
    if (!verifyPassword(curPw, user.passwordHash)) {
      return res.status(401).json({ ok: false, error: 'Current password is incorrect' });
    }
    const newPw = String(body.newPassword);
    if (newPw.length < 8 || newPw.length > 128) {
      return res.status(400).json({ ok: false, error: 'New password must be 8-128 characters' });
    }
    user.passwordHash = hashPassword(newPw);
    user.sessionVersion = (user.sessionVersion || 1) + 1;
    rotateSession = true;
    appendAuditEvent('PASSWORD_CHANGED', user.id, user.id, 'User updated password');
  }

  users[idx] = user;
  saveUsers(users);

  let token = null;
  if (rotateSession) {
    const signed = signSessionToken(user, req.authConfig.jwtExpiration);
    setSessionCookie(req, res, signed.token, signed.maxAgeSec);
    token = signed.token;
  }
  res.json({ ok: true, user: sanitizeUserView(user), token: token });
});

app.post('/api/auth/mfa/setup', requireSignedInUser, function (req, res) {
  const secret = generateBase32Secret(20);
  const users = loadUsers();
  const idx = users.findIndex(function (u) { return u.id === req.user.id; });
  if (idx === -1) return res.status(404).json({ ok: false, error: 'User not found' });
  users[idx].pendingMfaSecretEnc = encryptPii(secret);
  saveUsers(users);
  const label = encodeURIComponent('VLPManual:' + decryptPii(users[idx].usernameEnc));
  res.json({
    ok: true,
    secret: secret,
    otpauthUri: 'otpauth://totp/' + label + '?secret=' + secret + '&issuer=VLPManual'
  });
});

app.post('/api/auth/mfa/enable', requireSignedInUser, function (req, res) {
  const code = String((req.body && req.body.code) || '').trim();
  const users = loadUsers();
  const idx = users.findIndex(function (u) { return u.id === req.user.id; });
  if (idx === -1) return res.status(404).json({ ok: false, error: 'User not found' });
  const secret = decryptPii(users[idx].pendingMfaSecretEnc);
  if (!secret || !verifyTotpCode(secret, code)) {
    return res.status(400).json({ ok: false, error: 'Invalid 6-digit authenticator verification code' });
  }
  users[idx].mfaSecretEnc = encryptPii(secret);
  users[idx].pendingMfaSecretEnc = '';
  users[idx].mfaEnabled = true;
  saveUsers(users);
  appendAuditEvent('MFA_ENABLED', req.user.id, req.user.id, 'TOTP enrolled');
  res.json({ ok: true, user: sanitizeUserView(users[idx]) });
});

app.post('/api/auth/mfa/disable', requireSignedInUser, function (req, res) {
  const users = loadUsers();
  const idx = users.findIndex(function (u) { return u.id === req.user.id; });
  if (idx === -1) return res.status(404).json({ ok: false, error: 'User not found' });
  users[idx].mfaSecretEnc = '';
  users[idx].pendingMfaSecretEnc = '';
  users[idx].mfaEnabled = false;
  saveUsers(users);
  appendAuditEvent('MFA_DISABLED', req.user.id, req.user.id, 'TOTP removed');
  res.json({ ok: true, user: sanitizeUserView(users[idx]) });
});

app.post('/api/auth/api-key', requireSignedInUser, function (req, res) {
  if (!req.authConfig.enableApiKeys && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'API keys are disabled by administrator' });
  }
  const rawKey = 'vlp_sk_' + crypto.randomBytes(24).toString('hex');
  const users = loadUsers();
  const idx = users.findIndex(function (u) { return u.id === req.user.id; });
  if (idx === -1) return res.status(404).json({ ok: false, error: 'User not found' });
  users[idx].apiKeyHash = hashApiKey(rawKey);
  saveUsers(users);
  appendAuditEvent('API_KEY_ROTATED', req.user.id, req.user.id, 'Personal API key generated');
  res.json({ ok: true, apiKey: rawKey });
});

app.delete('/api/auth/api-key', requireSignedInUser, function (req, res) {
  const users = loadUsers();
  const idx = users.findIndex(function (u) { return u.id === req.user.id; });
  if (idx === -1) return res.status(404).json({ ok: false, error: 'User not found' });
  users[idx].apiKeyHash = '';
  saveUsers(users);
  res.json({ ok: true });
});

/* =========================================================================
 * Admin Panel Routes (Users, Groups, Authentication Config, Audit)
 * ========================================================================= */
app.get('/api/admin/users', requireAdminUser, function (_req, res) {
  const users = loadUsers().map(sanitizeUserView);
  res.json({ ok: true, users: users });
});

app.post('/api/admin/users', requireAdminUser, function (req, res) {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const usernameInput = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  const role = ['admin', 'user', 'pending'].includes(body.role) ? body.role : 'user';
  const groupId = String(body.groupId || '');

  if (!name) return res.status(400).json({ ok: false, error: 'Name is required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ ok: false, error: 'Valid email is required' });
  const username = (usernameInput || email.split('@')[0]).replace(/[^a-z0-9._-]/g, '');
  if (!username || username.length < 2) return res.status(400).json({ ok: false, error: 'Valid username is required' });
  if (password.length < 8 || password.length > 128) return res.status(400).json({ ok: false, error: 'Password must be 8-128 characters' });

  const users = loadUsers();
  const eIdx = blindIndex(email);
  const uIdx = blindIndex(username);
  if (users.some(function (u) { return u.emailIndex === eIdx || u.usernameIndex === uIdx; })) {
    return res.status(409).json({ ok: false, error: 'User with that email or username already exists' });
  }

  const created = {
    id: crypto.randomUUID(),
    nameEnc: encryptPii(name),
    emailEnc: encryptPii(email),
    usernameEnc: encryptPii(username),
    emailIndex: eIdx,
    usernameIndex: uIdx,
    passwordHash: hashPassword(password),
    role: role,
    groupId: groupId,
    apiKeyHash: '',
    mfaEnabled: false,
    mfaSecretEnc: '',
    sessionVersion: 1,
    createdAt: new Date().toISOString(),
    lastActiveAt: ''
  };
  users.push(created);
  saveUsers(users);
  appendAuditEvent('ADMIN_CREATE_USER', req.user.id, created.id, 'Role: ' + role);
  res.status(201).json({ ok: true, user: sanitizeUserView(created) });
});

app.put('/api/admin/users/:id', requireAdminUser, function (req, res) {
  const users = loadUsers();
  const idx = users.findIndex(function (u) { return u.id === req.params.id; });
  if (idx === -1) return res.status(404).json({ ok: false, error: 'User not found' });

  const body = req.body || {};
  const user = users[idx];

  if (body.role && ['admin', 'user', 'pending'].includes(body.role) && body.role !== user.role) {
    if (user.role === 'admin' && body.role !== 'admin') {
      const adminCount = users.filter(function (u) { return u.role === 'admin'; }).length;
      if (adminCount <= 1) {
        return res.status(400).json({ ok: false, error: 'Cannot demote the last remaining administrator' });
      }
    }
    user.role = body.role;
    user.sessionVersion = (user.sessionVersion || 1) + 1;
    appendAuditEvent('ADMIN_ROLE_CHANGE', req.user.id, user.id, 'New role: ' + body.role);
  }
  if (body.groupId !== undefined) user.groupId = String(body.groupId || '');
  if (body.name) user.nameEnc = encryptPii(String(body.name).trim());
  if (body.email) {
    const email = String(body.email).trim().toLowerCase();
    const eIdx = blindIndex(email);
    if (users.some(function (u, ui) { return ui !== idx && u.emailIndex === eIdx; })) {
      return res.status(409).json({ ok: false, error: 'Email already used by another user' });
    }
    user.emailEnc = encryptPii(email);
    user.emailIndex = eIdx;
  }
  if (body.newPassword) {
    const np = String(body.newPassword);
    if (np.length < 8 || np.length > 128) return res.status(400).json({ ok: false, error: 'Password must be 8-128 chars' });
    user.passwordHash = hashPassword(np);
    user.sessionVersion = (user.sessionVersion || 1) + 1;
    appendAuditEvent('ADMIN_PASSWORD_RESET', req.user.id, user.id, 'Password reset by admin');
  }
  if (body.resetMfa === true) {
    user.mfaEnabled = false;
    user.mfaSecretEnc = '';
    user.pendingMfaSecretEnc = '';
  }

  users[idx] = user;
  saveUsers(users);
  res.json({ ok: true, user: sanitizeUserView(user) });
});

app.delete('/api/admin/users/:id', requireAdminUser, function (req, res) {
  const users = loadUsers();
  const target = users.find(function (u) { return u.id === req.params.id; });
  if (!target) return res.status(404).json({ ok: false, error: 'User not found' });
  if (target.id === req.user.id) {
    return res.status(400).json({ ok: false, error: 'Cannot delete your currently signed-in account' });
  }
  if (target.role === 'admin') {
    const adminCount = users.filter(function (u) { return u.role === 'admin'; }).length;
    if (adminCount <= 1) return res.status(400).json({ ok: false, error: 'Cannot delete the last administrator' });
  }
  const remaining = users.filter(function (u) { return u.id !== target.id; });
  saveUsers(remaining);
  appendAuditEvent('ADMIN_DELETE_USER', req.user.id, target.id, 'User account deleted');
  res.json({ ok: true });
});

app.get('/api/admin/groups', requireAdminUser, function (_req, res) {
  res.json({ ok: true, groups: loadGroups() });
});

app.post('/api/admin/groups', requireAdminUser, function (req, res) {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const description = String(body.description || '').trim();
  if (!name) return res.status(400).json({ ok: false, error: 'Group name is required' });
  const groups = loadGroups();
  if (groups.some(function (g) { return g.name.toLowerCase() === name.toLowerCase(); })) {
    return res.status(409).json({ ok: false, error: 'Group already exists' });
  }
  const group = {
    id: sanitizeId(name.toLowerCase() + '-' + Date.now()),
    name: name,
    description: description,
    createdAt: new Date().toISOString()
  };
  groups.push(group);
  saveGroups(groups);
  appendAuditEvent('ADMIN_CREATE_GROUP', req.user.id, group.id, 'Group created: ' + name);
  res.status(201).json({ ok: true, group: group });
});

app.delete('/api/admin/groups/:id', requireAdminUser, function (req, res) {
  const groups = loadGroups().filter(function (g) { return g.id !== req.params.id; });
  saveGroups(groups);
  res.json({ ok: true });
});

app.get('/api/admin/auth-config', requireAdminUser, function (req, res) {
  res.json({ ok: true, config: getSafeAuthConfigForAdmin(req.authConfig) });
});

app.put('/api/admin/auth-config', requireAdminUser, function (req, res) {
  const body = req.body || {};
  const cur = loadAuthConfig();
  const prevRequireMfa = Boolean(cur.requireMfa);

  if (['pending', 'user', 'admin'].includes(body.defaultUserRole)) cur.defaultUserRole = body.defaultUserRole;
  if (body.defaultGroupId !== undefined) cur.defaultGroupId = String(body.defaultGroupId || '');
  if (body.enableLoginForm !== undefined) cur.enableLoginForm = Boolean(body.enableLoginForm);
  if (body.enableSignUp !== undefined) cur.enableSignUp = Boolean(body.enableSignUp);
  if (body.enableApiKeys !== undefined) cur.enableApiKeys = Boolean(body.enableApiKeys);
  if (body.jwtExpiration !== undefined) {
    const exp = String(body.jwtExpiration).trim();
    if (exp === '-1' || /^\d+\s*[smhdw]$/i.test(exp)) {
      cur.jwtExpiration = exp;
    }
  }
  if (body.requireMfa !== undefined) cur.requireMfa = Boolean(body.requireMfa);
  if (body.showAdminDetails !== undefined) cur.showAdminDetails = Boolean(body.showAdminDetails);
  if (body.adminContactEmail !== undefined) cur.adminContactEmail = String(body.adminContactEmail || '').trim();
  if (body.pendingOverlayTitle !== undefined) cur.pendingOverlayTitle = String(body.pendingOverlayTitle || '');
  if (body.pendingOverlayContent !== undefined) cur.pendingOverlayContent = String(body.pendingOverlayContent || '');

  // LDAP config
  if (body.ldapEnabled !== undefined) cur.ldapEnabled = Boolean(body.ldapEnabled);
  if (body.ldapServerUrl !== undefined) cur.ldapServerUrl = String(body.ldapServerUrl || '').trim();
  if (body.ldapBindDn !== undefined) cur.ldapBindDn = String(body.ldapBindDn || '').trim();
  if (body.ldapBindPassword && String(body.ldapBindPassword).trim()) {
    cur.ldapBindPasswordEnc = encryptPii(String(body.ldapBindPassword));
  }
  if (body.ldapSearchBase !== undefined) cur.ldapSearchBase = String(body.ldapSearchBase || '').trim();
  if (body.ldapSearchAttr !== undefined) cur.ldapSearchAttr = String(body.ldapSearchAttr || 'mail').trim();

  // OAuth / OIDC config
  if (body.enableOauthPersistentConfig !== undefined) cur.enableOauthPersistentConfig = Boolean(body.enableOauthPersistentConfig);
  if (body.oauthEnabled !== undefined) cur.oauthEnabled = Boolean(body.oauthEnabled);
  if (body.oauthProviderName !== undefined) cur.oauthProviderName = String(body.oauthProviderName || 'SSO').trim();
  if (body.oauthProviderUrl !== undefined) cur.oauthProviderUrl = String(body.oauthProviderUrl || '').trim();
  if (body.oauthClientId !== undefined) cur.oauthClientId = String(body.oauthClientId || '').trim();
  if (body.oauthClientSecret && String(body.oauthClientSecret).trim()) {
    cur.oauthClientSecretEnc = encryptPii(String(body.oauthClientSecret));
  }
  if (body.oauthRedirectUri !== undefined) cur.oauthRedirectUri = String(body.oauthRedirectUri || '').trim();
  if (body.oauthScopes !== undefined) cur.oauthScopes = String(body.oauthScopes || 'openid email profile').trim();
  if (body.oauthEmailClaim !== undefined) cur.oauthEmailClaim = String(body.oauthEmailClaim || 'email').trim();
  if (body.oauthUsernameClaim !== undefined) cur.oauthUsernameClaim = String(body.oauthUsernameClaim || 'name').trim();
  if (body.oauthPictureClaim !== undefined) cur.oauthPictureClaim = String(body.oauthPictureClaim || 'picture').trim();
  if (body.oauthSubClaim !== undefined) cur.oauthSubClaim = String(body.oauthSubClaim || 'sub').trim();
  [
    'oauthSignup', 'oauthMergeByEmail', 'oauthAutoRedirect',
    'oauthRoleMapping', 'oauthGroupMapping', 'oauthUpdateEmail',
    'oauthUpdateName', 'oauthUpdatePicture'
  ].forEach(function (k) {
    if (body[k] !== undefined) cur[k] = Boolean(body[k]);
  });
  if (body.oauthAllowedDomains !== undefined) cur.oauthAllowedDomains = String(body.oauthAllowedDomains || '*').trim();

  saveAuthConfig(cur);
  if (!prevRequireMfa && cur.requireMfa) {
    // Sign out all non-admin sessions cleanly or bump session versions when Require MFA changes
    const users = loadUsers().map(function (u) {
      if (u.id !== req.user.id) u.sessionVersion = (u.sessionVersion || 1) + 1;
      return u;
    });
    saveUsers(users);
  }
  appendAuditEvent('ADMIN_AUTH_CONFIG_UPDATED', req.user.id, 'auth-config', 'Authentication settings updated');
  res.json({ ok: true, config: getSafeAuthConfigForAdmin(cur) });
});

app.get('/api/admin/audit', requireAdminUser, function (_req, res) {
  const list = readJsonSafe(AUDIT_FILE);
  res.json({ ok: true, events: Array.isArray(list) ? list : [] });
});

/* =========================================================================
 * Sample Reference Manuals (Annex B & Annex C)
 * ========================================================================= */
app.get('/api/samples/:name', requireActiveUser, function (req, res) {
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

/* =========================================================================
 * Per-User Isolated Autosave & Snapshots + Shared Team Manuals
 * ========================================================================= */
app.get('/api/sessions/autosave', requireActiveUser, function (req, res) {
  const dir = getUserSessionsDir(req);
  const autoFile = path.join(dir, 'autosave.json');
  const saved = readJsonSafe(autoFile);
  if (!saved) {
    return res.json({ ok: true, exists: false });
  }
  res.json({ ok: true, exists: true, session: saved });
});

app.post('/api/sessions/autosave', requireActiveUser, function (req, res) {
  try {
    const dir = getUserSessionsDir(req);
    const autoFile = path.join(dir, 'autosave.json');
    const payload = req.body || {};
    const record = {
      id: 'autosave',
      ownerId: req.user ? req.user.id : 'legacy',
      name: payload.sessionName || (payload.manual && payload.manual.name) || 'Autosave',
      updatedAt: new Date().toISOString(),
      state: payload
    };
    atomicWriteJson(autoFile, record);
    res.json({ ok: true, updatedAt: record.updatedAt });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/sessions', requireActiveUser, function (req, res) {
  try {
    const dir = getUserSessionsDir(req);
    const files = listDirFilesSafe(dir).filter(function (f) {
      return f.endsWith('.json') && f !== 'autosave.json' && !f.endsWith('.tmp');
    });
    const list = files
      .map(function (f) {
        const doc = readJsonSafe(path.join(dir, f));
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

app.post('/api/sessions/save', requireActiveUser, function (req, res) {
  try {
    const dir = getUserSessionsDir(req);
    const body = req.body || {};
    const id = sanitizeId(body.id || ('snap-' + Date.now()));
    const state = body.state || {};
    const name = String(body.name || (state.manual && state.manual.name) || 'Snapshot').trim();
    const record = {
      id: id,
      ownerId: req.user ? req.user.id : 'legacy',
      name: name,
      updatedAt: new Date().toISOString(),
      state: state
    };
    atomicWriteJson(path.join(dir, id + '.json'), record);
    res.json({ ok: true, id: id, name: name, updatedAt: record.updatedAt });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/sessions/:id', requireActiveUser, function (req, res) {
  const dir = getUserSessionsDir(req);
  const id = sanitizeId(req.params.id);
  const filePath = path.join(dir, id + '.json');
  const doc = readJsonSafe(filePath);
  if (!doc) {
    return res.status(404).json({ ok: false, error: 'Session snapshot not found' });
  }
  res.json({ ok: true, session: doc });
});

app.delete('/api/sessions/:id', requireActiveUser, function (req, res) {
  const dir = getUserSessionsDir(req);
  const id = sanitizeId(req.params.id);
  if (id === 'autosave') {
    return res.status(400).json({ ok: false, error: 'Cannot delete autosave slot directly' });
  }
  const filePath = path.join(dir, id + '.json');
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  res.json({ ok: true });
});

// Shared Team Snapshots (/data/shared-sessions)
app.get('/api/sessions-shared', requireActiveUser, function (_req, res) {
  try {
    const users = loadUsers();
    const userNameById = {};
    users.forEach(function (u) { userNameById[u.id] = decryptPii(u.nameEnc) || 'User'; });
    const files = listDirFilesSafe(SHARED_SESSIONS_DIR).filter(function (f) {
      return f.endsWith('.json') && !f.endsWith('.tmp');
    });
    const list = files.map(function (f) {
      const doc = readJsonSafe(path.join(SHARED_SESSIONS_DIR, f));
      if (!doc) return null;
      const manual = (doc.state && doc.state.manual) || {};
      return {
        id: doc.id || f.replace(/\.json$/, ''),
        name: doc.name || manual.name || 'Shared Manual',
        manualName: manual.name || '',
        nodeCount: countContentNodes(manual.contentNodes || []),
        ownerId: doc.ownerId || '',
        authorName: userNameById[doc.ownerId] || doc.authorLabel || 'Instructor',
        updatedAt: doc.updatedAt || ''
      };
    }).filter(Boolean).sort(function (a, b) {
      return String(b.updatedAt).localeCompare(String(a.updatedAt));
    });
    res.json({ ok: true, sessions: list });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/sessions-shared', requireActiveUser, function (req, res) {
  try {
    const body = req.body || {};
    const id = sanitizeId(body.id || ('shared-' + Date.now()));
    const state = body.state || {};
    const name = String(body.name || (state.manual && state.manual.name) || 'Shared Manual').trim();
    const record = {
      id: id,
      ownerId: req.user ? req.user.id : 'legacy',
      name: name,
      updatedAt: new Date().toISOString(),
      state: state
    };
    atomicWriteJson(path.join(SHARED_SESSIONS_DIR, id + '.json'), record);
    res.json({ ok: true, id: id, name: name, updatedAt: record.updatedAt });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/sessions-shared/:id', requireActiveUser, function (req, res) {
  const id = sanitizeId(req.params.id);
  const doc = readJsonSafe(path.join(SHARED_SESSIONS_DIR, id + '.json'));
  if (!doc) return res.status(404).json({ ok: false, error: 'Shared snapshot not found' });
  res.json({ ok: true, session: doc });
});

app.delete('/api/sessions-shared/:id', requireActiveUser, function (req, res) {
  const id = sanitizeId(req.params.id);
  const filePath = path.join(SHARED_SESSIONS_DIR, id + '.json');
  const doc = readJsonSafe(filePath);
  if (!doc) return res.status(404).json({ ok: false, error: 'Shared snapshot not found' });
  if (req.user && req.user.role !== 'admin' && doc.ownerId !== req.user.id) {
    return res.status(403).json({ ok: false, error: 'Only the author or an administrator can delete this shared manual' });
  }
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  res.json({ ok: true });
});

/* =========================================================================
 * Persistent Image Upload & Retrieval
 * ========================================================================= */
app.post('/api/images', requireActiveUser, function (req, res) {
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

app.get('/api/images/:filename', requireActiveUser, function (req, res) {
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

/* =========================================================================
 * Export Endpoints: VLP XML/ZIP (Existing) & Student Document Formats (.pdf, .html, .mdx, .rtf)
 * ========================================================================= */
app.post('/api/export-zip', requireActiveUser, async function (req, res) {
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

app.post('/api/import-zip', requireActiveUser, async function (req, res) {
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

app.post('/api/export-document', requireActiveUser, function (req, res) {
  try {
    const body = req.body || {};
    const manual = body.manual;
    const format = String(body.format || 'pdf').toLowerCase();
    const scope = body.scope === 'current' ? 'current' : 'full';
    const activeNodeId = body.activeNodeId || '';
    const imagesMeta = Object.assign({}, body.imagesMeta || {});
    const sampleSource = body.sampleSource || '';

    if (!manual || !Array.isArray(manual.contentNodes)) {
      return res.status(400).json({ ok: false, error: 'Missing manual payload' });
    }
    if (!['pdf', 'html', 'mdx', 'rtf'].includes(format)) {
      return res.status(400).json({ ok: false, error: 'Unsupported format: ' + format });
    }

    // Resolve all referenced image buffers & base64 dataUrls for offline self-contained student exports
    const resolvedImages = {};
    const nodesToExport = VLPFormatter.collectExportNodes(manual, scope, activeNodeId);
    nodesToExport.forEach(function (it) {
      const html = VLPFormatter.generateNodeHtml(it.node, { imageMode: 'vlp' });
      const re = /<img\b[^>]*\bsrc=["']([^"']+)["']/gi;
      let m;
      while ((m = re.exec(html)) !== null) {
        const rawSrc = m[1];
        if (rawSrc.startsWith('data:')) {
          const decoded = decodeDataUrl(rawSrc);
          if (decoded) resolvedImages[rawSrc] = decoded.buffer;
        } else {
          const fn = VLPFormatter.extractFilenameFromSrc(rawSrc);
          const buf = resolveImageBufferForZip(fn, imagesMeta, sampleSource);
          if (buf) {
            resolvedImages[rawSrc] = buf;
            resolvedImages[fn] = buf;
            resolvedImages['./images/' + fn] = buf;
            if (!imagesMeta[fn] || !imagesMeta[fn].dataUrl) {
              imagesMeta[fn] = Object.assign({}, imagesMeta[fn] || {}, {
                filename: fn,
                dataUrl: 'data:' + guessMimeType(fn) + ';base64,' + buf.toString('base64')
              });
            }
          }
        }
      }
    });

    const baseFilename = sanitizeId((manual.name || 'vlp-manual') + (scope === 'current' ? '-page' : ''));
    const exportOpts = {
      scope: scope,
      activeNodeId: activeNodeId,
      imageMap: imagesMeta,
      samplePrefix: sampleSource ? '/samples/' + sampleSource + '/images' : '',
      colorTheme: manual.colorTheme || 'crimson-slate',
      resolvedImages: resolvedImages
    };

    if (format === 'html') {
      const htmlOut = VLPFormatter.generateStandaloneManualHtml(manual, exportOpts);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="' + baseFilename + '.html"');
      return res.send(htmlOut);
    }

    if (format === 'mdx') {
      const mdxOut = VLPFormatter.generateManualMdx(manual, exportOpts);
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="' + baseFilename + '.mdx"');
      return res.send(mdxOut);
    }

    if (format === 'rtf') {
      const rtfOut = VLPFormatter.generateManualRtf(manual, exportOpts);
      res.setHeader('Content-Type', 'application/rtf; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="' + baseFilename + '.rtf"');
      return res.send(rtfOut);
    }

    const pdfBuf = VLPFormatter.generateManualPdfBuffer(manual, exportOpts);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="' + baseFilename + '.pdf"');
    return res.send(pdfBuf);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', function () {
  console.log('VLP Manual Generator listening on http://0.0.0.0:' + PORT);
  console.log('Persistent storage directory: ' + DATA_DIR);
});
