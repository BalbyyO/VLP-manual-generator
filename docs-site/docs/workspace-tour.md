---
sidebar_position: 3
title: Studio Workspace Tour
---

# Studio Workspace Tour

The authoring studio is organized into a responsive **3-pane layout** designed to stay readable on widescreen monitors, laptops, high browser zoom (`125%`–`200%`), and tablets.

![3-Pane Studio Interface](/img/screenshots/03-workspace-dark-overview.png)

## 1. Top Action Bar

| Control | Purpose |
| --- | --- |
| **Ready / Saved badge** | Shows live dual auto-save status (browser `IndexedDB` + server disk `/data/users/<id>/sessions/autosave.json`). |
| **Color Theme Swatches** | Picks from 8 Figma-curated Light/Dark palettes (`Crimson & Slate`, `Cobalt & Electric Sky`, `Emerald & Mint`, `Royal Indigo & Violet`, `Amber Gold & Obsidian`, `Teal & Coral`, `Rose & Burgundy`, `Cyber Cyan & Neon Slate`). |
| **Dark / Light Toggle** | Opens in **Dark Mode** by default and switches both the Studio UI and VLP Live Preview between Dark and high-contrast Light mode. |
| **Undo / Redo** | Full edit history (`Ctrl+Z` / `Ctrl+Y` or `Ctrl+Shift+Z`) covering typing bursts, toolbar formatting, tables, credentials, themes, and structural edits. |
| **Templates & Button Guide** | Opens the 3-tab modal (**Pre-Made Templates**, **What Every Button Does**, and **Reference Manuals** with Annex B & Annex C). |
| **Import XML / ZIP** | Imports an existing VLP `content.xml` or `.zip` package (including `./images/*`). |
| **Export ▾** | Unified submenu for VLP `content.xml`, VLP `.zip` packages, and Student Documents (`.pdf`, `.html`, `.mdx`, `.rtf`, Print). |
| **Report Bug** | Opens a pre-filled GitHub New Issue form with your version, viewport, and theme metadata. |
| **Account / Admin Pill** | Opens the Settings & Admin panel (`Account`, `Sessions`, `Data Controls`, `About`, plus `Users`, `Groups`, `Authentication`, `Security Audit` for admins). |

### Custom Color Theme Swatches

Click the color theme dropdown in the top bar to restyle both the studio accent and the generated VLP `<style>` CSS tokens across every page in your manual:

![Color Theme Swatches Dropdown](/img/screenshots/04-color-theme-swatches.png)

## 2. Left Pane — Manual Structure Tree

The left sidebar mirrors the exact hierarchy of a VLP `content.xml` package (`Manual Root` → `Chapters` → `Step Pages`):

- Set **Manual Package Name** (e.g., `dsac.annexb.lab01`) and **Language** (`en`).
- Click **`New`** to start a blank manual, **`+ Chapter`** to add a Level 1 chapter, or **`+ Page`** to add a Level 2 procedural page.
- Each node badge indicates its layout mode:
  - **`OVR`** — Course Overview / Chapter Introduction (`.course-overview`)
  - **`STP`** — Procedural Steps Table (`.lab-wrapper`)
  - **`RAW`** — Preserved Legacy / Imported HTML
- Hover any node to reorder (`↑` / `↓`) or delete (`×`).

## 3. Center Pane — Hybrid Editor & Formatting Toolbar

- Switch any page between **Course Overview**, **Procedural Steps**, and **Raw / Imported** using the segmented control next to the node title.
- Every toolbar button has a **`?`** icon beside it that jumps straight to its live Light/Dark demonstration inside the **Button Demo Guide**.

## 4. Right Pane — Live VLP Preview & Split-Screen Ratio

Use the right pane to inspect your output before copying or exporting:

- **Tabs**: Switch between **Live VLP Preview**, **HTML (`</>` Source)**, and **Node XML**.
- **Scroll Preservation**: Live Preview updates in-place as you type—it never snaps back to the top of the page.
- **VLP Ratio Selector**: Test how your tables, commands, and screenshots scale inside VLP's right-hand manual pane:
  - `Auto (100%)`
  - `VLP 1/3 Taskbar (360px)`
  - `VLP 1/2 Split (520px)`
  - `Desktop (900px)`

![VLP 1/3 Taskbar Split-Screen Light Mode Preview](/img/screenshots/07-vlp-split-screen-preview.png)

:::tip Narrow Screens & High Browser Zoom
When your browser width is `<= 1024px` (or zoomed to `150%`–`200%`), a **Structure | Editor | Preview** tab bar appears automatically so each pane gets the full screen width without horizontal overflow.
:::
