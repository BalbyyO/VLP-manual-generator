# Contributing to VLP Manual HTML Formatter & XML Builder

Thank you for helping improve **VLP Manual HTML Formatter & XML Builder**! Before submitting a pull request, please review the project's core engineering constraints and verification workflow.

---

## Core Design Principles

1. **100% Air-Gapped & Self-Contained**
   - Never add external CDN links, Google Fonts, remote icon packs, external analytics, or runtime internet dependencies in `public/` or `server.js`.
   - All assets (`public/styles.css`, `public/assets/*.svg`, `public/vlp-formatter.js`) must work offline and inside `docker run --network none`.

2. **Deterministic Native Formatting Only (No AI / No Heuristic Guessing)**
   - This tool operates completely without AI services.
   - Do **not** add heuristic keyword guessing that automatically tags plain words as UI targets, commands, or keys. Inline semantic tags (`.ui-target`, `code.cmd-inline`, `.key-press`) must only be applied via explicit toolbar buttons or explicit markup shortcuts (`**Text**` / `[ui]Text[/ui]`, `` `cmd` ``, `[[Key]]`).
   - Preserve exact student wording and step sequence in numbered procedures (**Strict Step Fidelity**).

3. **Strict VLP Specification Fidelity**
   - All generated output must start with the Master `<style>` block from `vlp-manual-html-formatter.txt` so Light mode and VLP / VMware Clarity Dark mode render reliably without white odd table rows or washed-out code pills.
   - Follow the **Strict Red Box Rule**: reserve `.purpose-card` exclusively for Instructional Purpose and `.lab-note` exclusively for initial/switched Target VM Credentials.
   - Keep `public/vlp-formatter.js` as a Universal Module Definition (UMD) module compatible with both browser globals (`window.VLPFormatter`) and Node.js (`require('./public/vlp-formatter.js')`).

---

## Local Development Setup

### Prerequisites
- **Node.js 20+** (`npm` included)
- **Docker** (optional, required for container verification)

### Setup & Run
```bash
git clone https://github.com/BalbyyO/VLP-manual-generator.git
cd VLP-manual-generator
npm install
npm start
```
The application runs at `http://localhost:8080`.

---

## Running Tests & Verification

All changes must pass the automated unit and HTTP API verification suite (`test/verify.js`) before opening a PR:

```bash
npm test
```

`npm test` validates:
1. `dsac.annexb.lab01-en/content.xml` round-trip parsing and serialization
2. `dsac.annexc.lab01-en/content.xml` chapter step consolidation and legacy HTML cleanup
3. Strict non-heuristic formatting and explicit markup shortcuts
4. Master CSS rules, offline template integrity, and zero external URL audit
5. HTTP API endpoints (`/api/health`, `/api/samples/annexb`, `/api/samples/annexc`)
6. Session autosave, snapshot CRUD, persistent images, and `.zip` export/import round-trip

### Air-Gapped Docker Verification
If you modify `Dockerfile`, `server.js`, or `public/` assets, also verify the container image with networking disabled:

```bash
docker build -t vlp-manual-generator:test .
docker run --rm --network none -d --name vlp-test vlp-manual-generator:test
docker exec vlp-test node -e "fetch('http://127.0.0.1:8080/api/health').then(r=>r.json()).then(console.log)"
docker stop vlp-test
```

---

## Submitting Changes

1. Fork or branch from `main` (e.g., `fix/xml-entity-edge-case` or `feat/step-reorder`).
2. Keep functions focused and avoid duplicating logic between `public/vlp-formatter.js` and `server.js`.
3. Run `npm test` and confirm all checks pass cleanly.
4. Open a Pull Request describing:
   - What problem or workflow improvement the change addresses
   - How it preserves VLP Light/Dark compatibility and air-gapped execution
   - The verification commands run and their results

For security issues, please see [SECURITY.md](./SECURITY.md) instead of opening a public issue.
