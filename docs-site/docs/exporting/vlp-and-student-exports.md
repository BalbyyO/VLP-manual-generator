---
sidebar_position: 1
title: Exporting for VLP & Students
---

# Exporting for VLP & Student Handouts

All export options live inside the unified **Export ▾** submenu in the top bar, plus the **Copy VLP HTML** button at the bottom of the right-hand preview pane.

![Unified Export Submenu](/img/screenshots/08-export-menu.png)

## 1. Copying HTML Directly into VLP CKEditor (`</>` Source)

When editing a single page inside VLP's web portal:

1. Verify your page in **Live VLP Preview** across both **Light Mode** and **VLP Dark Mode**, and check **VLP 1/3 Taskbar (360px)** to confirm images and tables scale without horizontal clipping.
2. In the preview footer, choose **Copied HTML Images**:
   - **`./images/<uuid>.png (VLP Standard)`** — use when images are already bundled in your VLP manual package.
   - **`Inline Base64 Data URI (Standalone)`** — embeds screenshots directly inside the HTML snippet so you can paste straight into VLP CKEditor's `</>` Source view without separate image uploads.
3. Click **Copy VLP HTML** and paste into VLP's `</>` Source editor.

## 2. Exporting Native VLP XML & ZIP Packages

Open **Export ▾ → VLP Native Package**:

- **Export VLP `content.xml`**: Downloads the complete hierarchical XML manifest (preserving `Manual`, `ContentNodes`, `orderIndex`, and `<images>` metadata).
- **Export VLP Package (`.zip`)**: Downloads a ready-to-upload VLP `.zip` archive containing `<manual-name>-<lang>/content.xml` and `<manual-name>-<lang>/images/*` with all referenced screenshots bundled.

## 3. Exporting Student Documents

First choose your **Scope** at the top of the **Export ▾** menu:
- **Full Manual** — exports every chapter and step page with section numbering and table of contents.
- **Current Page** — exports only the currently selected page.

Then select any offline student format under **Student Documents**:

| Format | Best For | Key Details |
| --- | --- | --- |
| **`.pdf` (Student PDF)** | Distributing offline lab guides to students | Pure binary PDF 1.4 generated natively on the server with embedded PNG/JPEG screenshots, themed headers, data tables, terminal boxes, and page footers. |
| **`.html` (Standalone Web)** | Browser viewing on air-gapped lab desktops | Single self-contained HTML5 file with embedded base64 images, clickable Table of Contents, print CSS, and an offline Light/Dark toggle button. |
| **`.mdx` (MDX Markdown)** | Documentation sites & Git repositories | Clean Markdown/MDX with YAML frontmatter, GFM tables, and fenced code blocks. |
| **`.rtf` (Rich Text / Word)** | Opening and editing in Microsoft Word / LibreOffice | Native RTF with formatted tables, callout borders, and embedded `\pngblip`/`\jpegblip` images. |
| **Print / Save PDF...** | Custom browser print scaling | Opens a clean print-formatted window ready for your browser's Print dialog. |
