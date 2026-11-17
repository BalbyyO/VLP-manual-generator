# Security Policy

## Supported Versions

| Version | Supported | Notes |
| --- | --- | --- |
| `0.3.x` (`beta 0.3.2`) | Yes | Current pre-release container image, multi-user auth, PII encryption & student exports |
| `0.2.x` (`beta 0.2.1`) | Security fixes | Superseded by `0.3.1-beta` |
| `main` | Yes | Active development branch |

---

## Reporting a Vulnerability

Please **do not** report security vulnerabilities through public GitHub issues.

Report vulnerabilities privately using **GitHub Security Advisories**:

- **Report Privately**: [Open a Private Security Advisory](https://github.com/BalbyyO/VLP-manual-generator/security/advisories/new)

### What to Include
- Description of the issue and affected file(s) or API endpoint(s)
- Steps to reproduce or a minimal proof-of-concept payload (such as a malformed XML/ZIP input or path traversal attempt)
- Potential impact (e.g., XSS in preview/exported HTML, arbitrary file write, container misconfiguration)

### Response Targets
- **Initial Acknowledgment**: Within 3 business days
- **Triage & Fix Plan**: Within 7 days for confirmed vulnerabilities

---

## Security Architecture & Air-Gapped Design

`VLP-manual-generator` is engineered for **offline and air-gapped training environments**:

1. **Zero External Network Dependencies**
   - No external CDNs, remote fonts, third-party analytics, telemetry, or external AI APIs are used at runtime.
   - The Docker image runs cleanly with `--network none`.

2. **Authentication, Password Storage & PII Encryption at Rest (`server.js`)**
   - **Password Hashing**: Passwords (8–128 characters) are hashed with per-user 32-byte random CSPRNG salts via `crypto.scryptSync` (`N=16384, r=8, p=1, keylen=64`) and compared using `crypto.timingSafeEqual`.
   - **PII & Secret Encryption**: User PII (`name`, `email`, `username`) and sensitive admin integration credentials (`oauthClientSecret`, `ldapBindPassword`) are encrypted at rest on disk using **AES-256-GCM** (random 12-byte IV, authenticated data tag) backed by `/data/.secret_key` (`0600` permissions) or `APP_SECRET_KEY`.
   - **Blind Lookup Indexes**: Email and username uniqueness and sign-in resolution use keyed `HMAC-SHA256` blind indexes so plaintext PII never appears in `/data/users.json` or audit logs.
   - **Session & HTTP Hardening**: Sessions use HMAC-SHA256 signed `HttpOnly; SameSite=Strict` cookies with configurable expiration (`4w` default), server-side `sessionVersion` revocation on password/role changes, login brute-force throttling (HTTP `429`), and strict security response headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: no-referrer`).
   - **Per-User Workspace Isolation**: Each active account stores its autosaves and snapshots in `/data/users/<userId>/sessions/`, preventing concurrent authors from overwriting one another.

3. **Filesystem & Path Traversal Controls (`server.js`)**
   - All user-supplied session identifiers and uploaded/imported image filenames are sanitized through `sanitizeId`, `sanitizeFilename`, and `path.basename` before touching `/data/sessions` or `/data/images`.
   - Session JSON persistence uses atomic temporary-file writes followed by `fs.renameSync` to prevent partial writes.

3. **HTML/XML Escaping & Preview Isolation (`public/vlp-formatter.js`, `public/app.js`)**
   - Plain text inputs, XML text nodes, and XML attributes are entity-escaped deterministically via `escapeHtmlPreserveEntities`, `escapeXmlText`, and `escapeXmlAttr`.
   - Live HTML rendering runs inside a dedicated `<iframe srcdoc>` (`#vlpPreviewFrame`) isolated from the host application UI.
   - **Note on Raw / Imported Mode**: Imported `content.xml` or `.zip` packages may contain arbitrary legacy HTML. Only import VLP packages from trusted authors.

4. **Deployment Recommendations**
   - When deploying on a shared host or lab network, bind behind a reverse proxy with authentication/TLS if exposed beyond `localhost`.
   - Mount `/data` to a dedicated volume (`./data:/data`) with appropriate host permissions so persisted sessions and screenshots remain isolated.
