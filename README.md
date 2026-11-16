# VLP Manual HTML Formatter & XML Builder

## About

**VLP Manual HTML Formatter & XML Builder** is a self-contained, air-gapped authoring studio built for **VMware Lab Platform (VLP)** instructors and technical manual developers. VLP's rich-text CKEditor frequently injects incompatible Word/Office inline styles, breaks dark-mode contrast with opaque table/list backgrounds, and scatters micro-steps across dozens of legacy XML nodes.

This application converts raw text, draft notes, and legacy `content.xml` chapters into standardized, light-and-dark-mode compatible HTML5 snippets (`</> Source` ready) or complete VLP `.zip` archives (`content.xml` + `images/`)—running 100% natively without AI tools or external internet access.

## Release & Pre-Packaged Docker Image (`beta 0.2.0`)

- **Container Registry Image (Pull Directly)**: `docker pull ghcr.io/balbyyo/vlp-manual-generator:latest` (also tagged `0.2.0-beta`)
- **GitHub Release (`beta 0.2.0`)**: [v0.2.0-beta Release Page](https://github.com/BalbyyO/VLP-manual-generator/releases/tag/v0.2.0-beta)
- **Direct Packaged Docker Image Download (`.tar`)**: [vlp-manual-generator-0.2.0-beta.tar](https://github.com/BalbyyO/VLP-manual-generator/releases/download/v0.2.0-beta/vlp-manual-generator-0.2.0-beta.tar)

---

## Key Features

- **100% Native & Air-Gapped**: Deterministic formatting engine (`public/vlp-formatter.js`) with zero external CDNs, fonts, or AI dependencies.
- **Strict VLP Spec Compliance**: Implements the Master `<style>` block and layout rules from `vlp-manual-html-formatter.txt` (Course Overview `.course-overview`, Procedural Steps `.lab-wrapper`, `.purpose-card`, `.lab-note`, and semantic inline tags).
- **Curated Color Themes (Figma Color Combinations)**: Top-bar theme dropdown with 8 pre-defined Light/Dark-compatible palettes (`Crimson & Slate`, `Cobalt & Electric Sky`, `Emerald & Mint`, `Royal Indigo & Violet`, `Amber Gold & Obsidian`, `Teal & Coral`, `Rose & Burgundy`, `Cyber Cyan & Neon Slate`) that restyle both the Editor UI and generated HTML `<style>` tokens.
- **Rich Text & Semantic Toolbar**: Bold (`Ctrl+B`), Italic (`Ctrl+I`), Underline (`Ctrl+U`), Strikethrough (`Ctrl+Shift+S`), Text Highlight, Bullet/Numbered Lists, plus `UI Target`, `Command`, and `Key Press`.
- **Interactive Data Tables Everywhere**: Add structured `.vlp-data-table` grids inside individual **Steps**, **Chapters**, or **Overviews** (with optional titles, header rows, `+Row/+Col`), plus automatic table extraction when consolidating legacy Annex C XML chapters.
- **Multi-System VM Credentials Everywhere**: Add one or multiple Target VM credential blocks (`Target System`, `Username`, `Password`, `Role/IP`) on **Overviews**, **Step Page Headers**, and **inside individual Steps**.
- **Indented Highlighted Context Box**: Single merged `.step-context` input with theme-matched shading and indentation without forced `"What you are doing:"` / `"Why this matters:"` labels.
- **Multi-Node XML & ZIP Package Support**: Navigate `Course Overview` → `Chapters` → `Step Pages`, import/export VLP `content.xml` or `.zip` packages, and consolidate legacy Word/CKEditor chapters in one click.
- **Pre-Made Templates & Live Button Guide**: Four ready-to-use templates plus a built-in **What Every Button Does** guide showing light/dark previews and HTML tags.
- **Dual Session Persistence**: Resists accidental tab/app closure using instant browser `IndexedDB` auto-save, debounced server disk persistence (`/data/sessions/autosave.json`), `navigator.sendBeacon` on tab hide/close, `beforeunload` protection, named snapshots, and `.json` project backups.

---

## Visual Interface Tour

![VLP Manual HTML Formatter 3-Pane Interface](./public/assets/interface-demo.svg)

```mermaid
flowchart LR
  A["1. Select or Paste Content\n(Templates, Raw Steps, or XML/ZIP)"] --> B["2. Format in Hybrid Editor\n(Toolbar Buttons or **UI** / `cmd` / [[Key]])"]
  B --> C["3. Attach Screenshots Inline\n(Ctrl+V Paste, Drag & Drop, Upload)"]
  C --> D["4. Verify in Live Preview\n(Light Mode & VLP Dark Mode)"]
  D --> E["5. Copy HTML for CKEditor </>\nor Export VLP ZIP"]
```

---

## Interface Navigation Demo (Step-by-Step)

### 1. Top Action Bar

| Control | What It Does |
| --- | --- |
| **Saved (Browser & Disk)** badge | Confirms dual auto-save status (`IndexedDB` + server `/data/sessions/autosave.json`). |
| **Undo** | Reverts structural changes (adding/deleting nodes, applying templates, consolidating chapters). |
| **Templates & Button Guide** | Opens the 3-tab modal: **Pre-Made Templates**, **What Every Button Does**, and **Reference Manuals**. |
| **Load Annex B** / **Load Annex C** | Loads the bundled reference manuals (`dsac.annexb.lab01-en` end-goal example and `dsac.annexc.lab01-en` multi-chapter XML example). |
| **Sessions** | Save/restore named server snapshots or download/restore portable `.json` project backups. |
| **Import XML / ZIP** | Imports an existing VLP `content.xml` or `.zip` manual package (including `./images/*`). |
| **Export XML** / **Export VLP ZIP** | Downloads `content.xml` alone or a complete `<manual-name>-en.zip` containing `content.xml` and `images/`. |

---

### 2. Left Pane — Manual Structure Tree

Mirrors the hierarchical `content.xml` structure (`Manual` → `Chapters` → `Step Pages`):

1. Set the **Manual Package Name** (e.g., `dsac.annexb.lab01`) and **Language** (`en`).
2. Click **`+ Chapter`** to add a Level 1 chapter or **`+ Page`** to add a Level 2 procedural step page.
3. Click any node in the tree to edit it. Badges show each page's active format:
   - `OVR` — Course Overview / Introduction (`.course-overview`)
   - `STP` — Procedural Steps Table (`.lab-wrapper`)
   - `RAW` — Preserved Legacy / Imported HTML
4. Hover over a node to move it (`↑` / `↓`) or delete (`×`).

---

### 3. Center Pane — Hybrid Editor & Formatting Toolbar

#### Switch Page Layout Mode
Use the segmented control next to the node title:
- **Course Overview**: Structured builder for Course Title (`<h1>`), Banner Image, Overview paragraphs, optional `<hr class="section-divider" />`, **Instructional Purpose Card** (`.purpose-card`), and **Target VM Credentials Card** (`.lab-note`).
- **Procedural Steps**: Visual step-row builder (`.lab-table` with circular red `.step-badge` counters), optional **Step Context** (`What you are doing:` / `Why this matters:`), **Terminal Verification Output** (`.term-box`), and inline screenshots.
- **Raw / Imported**: Preserves imported/custom HTML verbatim until you click **Convert Page to Procedural Steps** or **Convert Page to Course Overview**.

#### Apply Rich Text & Semantic Formatting (Toolbar, Shortcuts, or Markup)
Highlight text inside any editor box (including table cells) and click a toolbar button or press a keyboard shortcut. Clicking **`?`** next to any button opens a live Light/Dark demonstration:

| Toolbar Button | HTML Output | Shortcut / Markup | Use For |
| --- | --- | --- | --- |
| **UI Target** | `<span class="ui-target">...</span>` | `**Text**` or `[ui]Text[/ui]` | Buttons, menus, window names, VM names |
| **Command** | `<code class="cmd-inline">...</code>` | `` `command` `` | CLI commands, tools (`gpedit.msc`, `whoami`), usernames, passwords |
| **Key Press** | `<kbd class="key-press">... </kbd>` | `[[Key]]` | Keyboard keys & shortcuts (`Enter`, `Windows Key + R`) |
| **B / I / U / S** | `<strong>`, `<em>`, `<u>`, `<s>` | `Ctrl+B`, `Ctrl+I`, `Ctrl+U`, `Ctrl+Shift+S` | Bold, italic, underline, strikethrough formatting |
| **Mark** | `<mark class="vlp-highlight">...</mark>` | Toolbar button | Theme-tinted inline text highlighting |
| **• List / 1. List** | `<ul><li>...</li></ul>`, `<ol>...</ol>` | Toolbar button | Bullet and numbered lists with dark-mode transparency |

> **Note:** Formatting is strictly deterministic—plain text is never auto-tagged unless you apply a toolbar button, keyboard shortcut, or explicit markup.

#### Convert Raw Text into Steps
In **Procedural Steps** mode, paste plain or numbered steps into **Raw Text → Procedural Steps Converter**:

```text
1. Click **Start**, type `gpedit.msc`, and press [[Enter]].
Context: Opening the Local Group Policy Editor for baseline firewall setup.
2. Run `whoami` to confirm the active administrative account.
```

Click **Replace Steps** or **Append Steps**—exact step wording is preserved, and `Context:` lines automatically populate the indented shaded `.step-context` block.

#### Consolidate Legacy XML Chapters (Annex C Demo)
1. Click **Load Annex C** in the top bar.
2. Select any Level 1 Chapter node (such as `Configuring DCUI (Direct Console User Interface)`).
3. Click **Consolidate Chapter Steps into VLP Table** in the amber banner.
4. All child micro-steps are cleaned of Word/Office inline styles and zero-width characters, screenshots are mapped 1-to-1 inline inside step cells, and the chapter is standardized into a single `.lab-wrapper` table page.

#### Attach Screenshots Inline
- Focus a step's dropzone (or instruction textarea) and press **`Ctrl+V`** to paste from the clipboard, drag-and-drop an image file, or click to browse.
- Uploaded/pasted screenshots automatically receive a UUID filename (`./images/<uuid>.<ext>`), measure dimensions for `<images>` XML metadata, and persist on disk.

---

### 4. Right Pane — Live VLP Preview & Export

1. Toggle **Live VLP Preview**, **HTML (`</>` Source)**, or **Node XML** tabs.
2. Switch **Light Mode** ↔ **VLP Dark Mode** to verify contrast against VMware Clarity dark selectors.
3. Choose how images appear in copied HTML via **Copied HTML Images**:
   - `./images/<uuid>.png (VLP Standard)` — for VLP XML/ZIP manual packages
   - `Inline Base64 Data URI (Standalone)` — for standalone copy/paste directly into VLP CKEditor
4. Click **Copy VLP HTML** to copy the self-contained `<style>...</style>` + HTML container snippet.

---

## Quick Start & Air-Gapped Docker Deployment

### Option 1: Docker Compose (`docker-compose.yaml` Example)

Save this `docker-compose.yaml` anywhere on your system to pull and run the pre-packaged image directly from GitHub Container Registry without cloning the repository:

```yaml
services:
  vlp-manual-generator:
    image: ghcr.io/balbyyo/vlp-manual-generator:latest
    container_name: vlp-manual-generator
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - DATA_DIR=/data
    volumes:
      - ./data:/data
    restart: unless-stopped
```

Start the service:

```bash
docker compose up -d
```

Open **`http://localhost:8080`** in your browser. Sessions and uploaded screenshots persist across container restarts in `./data` (mapped to `/data` inside the container).

### Option 2: Air-Gapped Transfer (`beta 0.2.0` Tarball)

Download `vlp-manual-generator-0.2.0-beta.tar` from the [**beta 0.2.0** GitHub Release](https://github.com/BalbyyO/VLP-manual-generator/releases/tag/v0.2.0-beta) (or export locally with `docker save`), transfer it to your offline host, and run:

```bash
docker load -i vlp-manual-generator-0.2.0-beta.tar
docker run -d --name vlp-manual-generator -p 8080:8080 -v vlp_data:/data vlp-manual-generator:0.2.0-beta
```

To build and export the tarball yourself from source:

```bash
docker build -t vlp-manual-generator:0.2.0-beta .
docker save -o vlp-manual-generator-0.2.0-beta.tar vlp-manual-generator:0.2.0-beta
```

### Option 3: Local Node.js & Automated Tests

```bash
npm install
npm test
npm start
```

---

## Contributing, Security & License

- **Contributing**: See [CONTRIBUTING.md](./CONTRIBUTING.md) for local setup, air-gapped design rules, and test requirements.
- **Security**: See [SECURITY.md](./SECURITY.md) for private vulnerability reporting and security architecture details.
- **License**: Released under the [MIT License](./LICENSE).
