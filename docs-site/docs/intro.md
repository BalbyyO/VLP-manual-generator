---
sidebar_position: 1
title: Introduction
---

# Welcome to VLP Manual Generator

**VLP Manual HTML Formatter & XML Builder** (`v0.3.5-beta`) is a self-contained, 100% air-gapped authoring studio built specifically for **VMware Lab Platform (VLP)** instructors and lab manual developers.

![VLP Manual Generator Dark Mode Workspace](/img/screenshots/03-workspace-dark-overview.png)

## Why Use This Tool?

VLP's built-in CKEditor often injects incompatible Microsoft Word inline styles, breaks dark-mode readability with hard-coded white backgrounds, lets wide screenshots clip outside VLP's narrow split-screen manual pane, and scatters micro-steps across dozens of nested XML nodes.

This studio solves those problems deterministically—**with zero AI dependencies and zero external internet access**:

- **Strict VLP Light & Dark Mode Compatibility**: Every generated page includes an adaptive Master `<style>` block supporting VMware Clarity (`[clr-theme="dark"]`, `.theme-light`, `[data-theme="dark"]`) and responsive container queries (`@container vlp-manual`).
- **Two Structured Layouts**: Build **Course Overviews** (`.course-overview`) and **Procedural Steps Tables** (`.lab-wrapper`) using visual forms, or preserve/convert **Raw / Imported** HTML.
- **Built-In Live Preview**: Preview your exact VLP output in real time—in both **Light Mode** and **VLP Dark Mode**, and across **Auto (100%)**, **VLP 1/3 Taskbar (360px)**, **VLP 1/2 Split (520px)**, and **Desktop (900px)** widths—without losing your scroll position while typing.
- **Complete Delivery Options**: Copy self-contained HTML for VLP CKEditor (`</>` Source), export native VLP `content.xml` or `.zip` packages (`content.xml` + `images/`), or export standalone student documents (`.pdf`, `.html`, `.mdx`, `.rtf`).

## End-to-End Authoring Workflow

1. **[Install & Sign In](./installation)**: Launch via Docker Compose or an air-gapped `.tar` image and create your first local Administrator account.
2. **[Explore the Studio & Themes](./workspace-tour)**: Review the 3-pane layout, startup **Button Demo Guide**, and 8 Figma-curated color palettes.
3. **[Build a Course Overview](./creating-content/course-overview)**: Add a course title, banner image, overview narrative, data tables, Instructional Purpose card, and multi-system VM Credentials.
4. **[Author Procedural Steps](./creating-content/procedural-steps)**: Add numbered steps with semantic inline tags (`UI Target`, `Command`, `Key Press`), rich text formatting, indented context boxes, nested tables, terminal output, and inline screenshots.
5. **[Convert Raw Drafts](./creating-content/raw-text-converter)** or **[Consolidate Legacy XML](./creating-content/legacy-xml-consolidation)**: Turn plain notes or legacy Word/CKEditor XML chapters into clean VLP tables in seconds.
6. **[Export for VLP or Students](./exporting/vlp-and-student-exports)**: Copy HTML directly into VLP, export a VLP `.zip` package, or hand out offline student PDFs.

:::tip Built-in Startup Guide
The first time you sign in, the **Button Demo Guide** opens automatically so new authors can inspect every toolbar button in Light and Dark mode. Check **Do not show this guide automatically on startup** once you are comfortable with the controls—you can reopen it anytime from the top bar.
:::
