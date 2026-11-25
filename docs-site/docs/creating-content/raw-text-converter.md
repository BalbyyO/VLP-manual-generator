---
sidebar_position: 3
title: Raw Text to Steps Converter
---

# Raw Text → Procedural Steps Converter

The **Raw Text → Procedural Steps Converter (Native, No AI)** lets you paste draft instructions, bulleted notes, or multi-line copied prose and convert them into structured VLP step rows—100% locally and deterministically.

By default, the converter panel **starts hidden** at the top of the Procedural Steps editor so your workspace stays uncluttered until you click **Show Converter**.

![Raw Text to Procedural Steps Converter with Smart Grouping and Diagnostics](/img/screenshots/06-raw-text-converter.png)

## How Step & Paragraph Grouping Works

The converter is specifically engineered **not to break body text on single line wraps** (such as text copied from PDFs or narrow documents):

1. **Numbered Steps (`1.`, `2)`, `Step 1:`)**:
   - Any line starting with `1.`, `2)`, or `Step 1:` starts a new step and groups all wrapped lines, blank-line paragraphs, `Context:` notes, and terminal blocks underneath it until the next step number.
   - IPv4 addresses (like `192.168.10.11`) and decimals (like `6.7`) are ignored so they never trigger accidental step splits.
2. **Unnumbered Prose (Smart Mode)**:
   - When no step numbers are found, the converter splits on **blank lines** (or uniform bullet lists `-`, `•`, `*`), keeping multi-line paragraphs intact inside a single step.
3. **Unwrap Wrapped Paragraph Lines**:
   - Checked by default. Smoothly rejoins mid-sentence hard line breaks with a space and reconnects hyphenated word wraps, while preserving intentional breaks before sub-bullets, after colons (`:`), and between blank-line paragraphs.

## Split Modes

| Mode | Behavior |
| --- | --- |
| **Smart (Default)** | Groups by numbered prefixes (`1.`, `Step 1:`) when present; otherwise groups by blank-line paragraphs or bullet lists. |
| **Numbered Steps Only** | Splits strictly on `1.` / `Step 1:` prefixes. If none are found, keeps all text together as Step 1 and displays a note. |
| **Blank-Line Paragraphs** | Every paragraph separated by an empty line becomes one step. |
| **Line-by-Line** | Every non-empty line becomes its own step (ideal for short one-line checklists). |

## Supported Prefixes & Inline Shortcuts

```text
# Configure Baseline Firewall & Verify Identity
Intro: Complete these steps on NDSACDC01 before joining member servers.

1. Click **Start**, type `gpedit.msc`, and press [[Enter]].
Context: Local Group Policy controls baseline firewall and audit rules.
2. Open PowerShell and verify your active account:
```term
PS C:\Users\xadministrator> whoami
ndsac\xadministrator
```
```

- `# Title` / `Section:` / `Title:` → populates the **Section Header (`<h3>`)** if empty.
- `Intro:` → populates **Introductory Context Paragraphs**.
- `Context:` / `Note:` / `Lab note:` / `Check your work:` / `Tip:` → populates the indented shaded **`.step-context`** block.
- `Terminal:` / `Output:` / fenced ```` ```term ```` blocks → populates **`.term-box`** (automatically separating prompt, command, and output).

## Live Validation & Error Diagnostics

Before you click **Append Steps** or **Replace Steps**, the converter validates your input in real time:

- **Blocking Errors** (prevent overwriting steps): empty input, text over `200,000` characters, pasted raw PDF bytes (`%PDF-`), raw RTF control codes (`{\rtf`), or VLP XML (`<?xml` / `<Manual>`).
- **Non-Blocking Warnings** (auto-recovered cleanly): unclosed ```` ```term ```` fences (auto-closed at end of step), skipped empty step headers, or unbalanced `**UI**`, `` `cmd` ``, `[[Key]]`, or `[ui]...[/ui]` shortcuts.

:::tip Built-in Guide Shortcut
Click the **`?`** button right next to the converter title anytime to open the **Button Demo Guide** scrolled directly to the **Raw Text → Procedural Steps Converter** live demonstration card.
:::
