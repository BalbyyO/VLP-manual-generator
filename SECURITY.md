# Security Policy

## Supported Versions

| Version | Supported | Notes |
| --- | --- | --- |
| `0.1.x` (`beta 0.1.0`) | Yes | Current pre-release container image & tarball |
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

2. **Filesystem & Path Traversal Controls (`server.js`)**
   - All user-supplied session identifiers and uploaded/imported image filenames are sanitized through `sanitizeId`, `sanitizeFilename`, and `path.basename` before touching `/data/sessions` or `/data/images`.
   - Session JSON persistence uses atomic temporary-file writes followed by `fs.renameSync` to prevent partial writes.

3. **HTML/XML Escaping & Preview Isolation (`public/vlp-formatter.js`, `public/app.js`)**
   - Plain text inputs, XML text nodes, and XML attributes are entity-escaped deterministically via `escapeHtmlPreserveEntities`, `escapeXmlText`, and `escapeXmlAttr`.
   - Live HTML rendering runs inside a dedicated `<iframe srcdoc>` (`#vlpPreviewFrame`) isolated from the host application UI.
   - **Note on Raw / Imported Mode**: Imported `content.xml` or `.zip` packages may contain arbitrary legacy HTML. Only import VLP packages from trusted authors.

4. **Deployment Recommendations**
   - When deploying on a shared host or lab network, bind behind a reverse proxy with authentication/TLS if exposed beyond `localhost`.
   - Mount `/data` to a dedicated volume (`./data:/data`) with appropriate host permissions so persisted sessions and screenshots remain isolated.
