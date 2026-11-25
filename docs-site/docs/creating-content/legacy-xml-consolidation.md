---
sidebar_position: 4
title: Legacy XML & Chapter Consolidation
---

# Importing Legacy XML & Consolidating Chapters

Many existing VLP lab manuals exported from older courses contain Word/CKEditor inline clutter (`Calibri` fonts, zero-width spaces `\u200B`, hard-coded white backgrounds) and dozens of individual child micro-steps under each chapter.

VLP Manual Generator preserves imported HTML verbatim until you choose to standardize it—and includes **1-Click Chapter Step Consolidation**.

![Chapter Consolidation Banner on Annex C](/img/screenshots/09-chapter-consolidation.png)

## Importing an Existing VLP Manual

1. Click **Import XML / ZIP** in the top bar.
2. Select either:
   - A VLP **`content.xml`** file, or
   - A complete VLP **`.zip`** archive containing `content.xml` and `images/*` (all images are extracted automatically to `/data/images/` and linked into the live preview).
3. Want to practice first? Open **Templates & Button Guide → Reference Manuals** and load **Annex B** (formatted end-goal reference) or **Annex C** (4 chapters, 42 legacy micro-steps).

## 1-Click Chapter Step Consolidation

When you select a Level 1 Chapter node that contains child step pages, an amber **Chapter Node with Child Steps** banner appears at the top of the editor:

1. Select the Level 1 Chapter node in **Manual Structure** (for example, `Configuring DCUI` in Annex C).
2. Click **Consolidate Chapter Steps into VLP Table**.
3. The deterministic engine automatically:
   - Strips legacy Word/Office inline styles, empty `<p>` tags, and zero-width characters.
   - Extracts narrative context blocks into `.step-context` (without forcing auto-filled labels).
   - Converts legacy HTML `<table>` elements inside steps into editable `.vlp-data-table` grids.
   - Maps each micro-step's screenshot **1-to-1 inline** inside its matching `.lab-table` row.
   - Combines the child micro-steps into a clean, light- and dark-mode compliant `.lab-wrapper` procedural page.

## Converting Single Raw / Imported Pages

If a single page is in **Raw / Imported** (`RAW`) mode, use the buttons in the amber banner at the top of the Raw Editor:

- **Convert Page to Procedural Steps**: Standardizes the page into `.lab-wrapper` step cards.
- **Convert Page to Course Overview**: Standardizes the page into `.course-overview`.

:::info Full Undo Protection
Both **Consolidate Chapter Steps** and **Convert Page** push a snapshot to the Undo stack—press **`Ctrl+Z`** or click **Undo** if you want to revert immediately.
:::
