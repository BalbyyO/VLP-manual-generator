---
sidebar_position: 1
title: Building a Course Overview
---

# Building a Course Overview

Use **Course Overview** mode (`OVR`) for the opening page of your lab manual or for Level 1 Chapter introductions. It generates a clean `.course-overview` HTML layout compliant with VLP Light and Dark modes.

![Course Overview Editor and Live Preview](/img/screenshots/03-workspace-dark-overview.png)

## Step-by-Step: Create an Overview Page

1. Select the root node (or any Chapter node) in **Manual Structure** and confirm **Course Overview** is active in the mode switcher.
2. **Course Title (`<h1>`)**: Enter a bold centered heading (optional—leave blank for simple chapter introductions).
3. **Banner Image**:
   - Click **Upload** to choose an image file, drag & drop an image onto the dropzone, or click the dropzone and press **`Ctrl+V`** to paste a screenshot directly from your clipboard.
   - Images are automatically assigned a UUID filename (`./images/<uuid>.<ext>`) and persisted to `/data/images/`.
4. **Overview Paragraphs**:
   - Type or paste introductory narrative paragraphs (separate paragraphs with a blank line).
   - Highlight any word or phrase and click toolbar buttons (**UI Target**, **Command**, **Key Press**, **B**, **I**, **U**, **S**, **Mark**, **• List**, **1. List**) or use inline shortcuts (`**UI**`, `` `cmd` ``, `[[Key]]`).
5. **Overview / Chapter Data Tables (`.vlp-data-table`)**:
   - Click **`+ Add Table`** (or **`+ Table`** in the sticky toolbar) to build structured multi-column tables for IP addressing matrices, VLAN assignments, or topology summaries.
   - Add an optional table title, toggle the header row, and use **`+ Row`** / **`+ Col`** to expand the grid.

## Callout Cards (Red Box Rules)

Check **Include Section Divider (`<hr class="section-divider" />`)** to separate narrative text from your highlighted callout cards.

### Callout #1: Instructional Purpose Card (`.purpose-card`)

1. Enable **Callout #1: Instructional Purpose Card**.
2. Keep or customize the heading (default: `INSTRUCTIONAL PURPOSE`).
3. Enter the training objectives and scope for the lab manual.

### Callout #2: Multi-System Target VM Credentials (`.lab-note`)

You can list **one or multiple target systems** inside a single credentials card:

1. Enable **Callout #2: Target VM Credentials Card** and click **`+ Add VM System`** for each machine in your lab (e.g., Domain Controller, ESXi Host, Linux Jump Box).
2. Fill in **Target System** (formatted as `.ui-target`), **Username** and **Password** (formatted as `.cmd-inline`), and optional **Role / IP / Details**.

:::tip Quick Start with Pre-Made Templates
Open **Templates & Button Guide → Pre-Made Templates** and apply **Course Overview & Instructional Purpose** or **Multi-System VM Credentials** to populate a ready-to-edit overview in one click.
:::
