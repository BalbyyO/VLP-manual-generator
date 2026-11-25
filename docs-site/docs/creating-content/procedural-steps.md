---
sidebar_position: 2
title: Authoring Procedural Steps
---

# Authoring Procedural Steps

Use **Procedural Steps** mode (`STP`) for hands-on student lab instructions. It generates a responsive `.lab-wrapper` page with a `table-layout: fixed` `.lab-table`, numbered `.step-badge` counters, and responsive image/code scaling for VLP's split-screen taskbar.

![Procedural Steps Editor and All-Buttons Showcase](/img/screenshots/05-procedural-steps-editor.png)

## Page-Level Section Header, Intro & Credentials

At the top of a Procedural Steps page:

- **Section Header (`<h3>`)**: Accent left-bordered task title inside `.lab-header`.
- **Introductory Context Paragraphs**: Brief orientation before Step 1.
- **`+ Intro Table`**: Optional reference table displayed above the step table.
- **Page-Level VM Credentials**: Enable if students need credentials for one or more systems before starting Step 1.

## Adding & Organizing Steps

Click **`+ Add Step`** in the sticky toolbar or **`+ Add Procedural Step`** at the bottom of the editor. Each step card supports:

| Component | How to Add | Generated VLP Element |
| --- | --- | --- |
| **Instruction Body** | Type directly in the Step textarea | Main `<td>` cell next to `.step-badge` |
| **Context Highlight** | Click **`+ Context`** inside the step or toolbar | Indented, theme-shaded `<div class="step-context">` (single merged box with no forced labels) |
| **Step Data Table** | Click **`+ Table`** | Nested `<table class="vlp-data-table">` directly inside the step row |
| **Step VM Credentials** | Click **`+ VM Creds`** | Nested `<div class="lab-note">` inside the step row (supports multiple VM systems) |
| **Terminal Output** | Click **`+ Terminal`** | High-contrast `<div class="term-box">` with `.term-prompt`, command, and output lines |
| **Inline Screenshots** | Click **`+ Image`**, drag & drop, or press **`Ctrl+V`** | `<img class="step-inline-img" />` mapped 1-to-1 inside the step cell |

Use the **`↑`**, **`↓`**, and **`×`** controls on each step card header to reorder or remove steps. Step badge numbers update automatically.

## Rich Text & Semantic Formatting Toolbar

Formatting is **100% deterministic**—plain text is never guessed or auto-tagged unless you apply a toolbar button, keyboard shortcut, or explicit markup:

| Button | Shortcut / Markup | Output HTML | Best Used For |
| --- | --- | --- | --- |
| **UI Target** | `**Text**` or `[ui]Text[/ui]` | `<span class="ui-target">Text</span>` | Buttons, menus, tabs, window titles, VM names |
| **Command** | `` `command` `` | `<code class="cmd-inline">command</code>` | CLI commands, tools (`gpedit.msc`), usernames, passwords |
| **Key Press** | `[[Key]]` | `<kbd class="key-press">Key</kbd>` | Keyboard keys and shortcuts (`Enter`, `Windows Key + R`) |
| **B / I / U / S** | `Ctrl+B`, `Ctrl+I`, `Ctrl+U`, `Ctrl+Shift+S` | `<strong>`, `<em>`, `<u>`, `<s>` | Standard emphasis and edits |
| **Mark** | Toolbar button | `<mark class="vlp-highlight">...</mark>` | Theme-tinted inline callout highlight |
| **• List / 1. List** | Toolbar buttons | `<ul><li>...</li></ul>`, `<ol><li>...</li></ol>` | Bullet and numbered sub-lists |

:::tip Formatting Inside Table Cells
The toolbar buttons and keyboard shortcuts (`Ctrl+B`, `Ctrl+I`, `Ctrl+U`, `Ctrl+Shift+S`, `**UI**`, `` `cmd` ``, `[[Key]]`) work inside **overview boxes, step instructions, context boxes, and data table cells**!
:::
