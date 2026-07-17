---
name: chinese-formal-documents
description: "Use when creating, editing, or validating formal Chinese government-style documents, contracts, agreements, and other print-ready DOCX/PDF files with Typst and OfficeCLI."
version: 1.0.0
author: jerryisacat
license: MIT
metadata:
  hermes:
    tags: [document, docx, pdf, typst, officecli, chinese, government, contract, typography]
---

# Chinese Formal Documents

## When to use

Use this skill when the user asks to:

- 创建中文政府公文、通知、请示、报告、函或附件表格。
- 创建合同、协议、服务条款、签署页或合同附件。
- 同时输出可编辑 DOCX 和稳定版式 PDF。
- 检查正式中文文书的字体、页边距、分页、编号、表格、页码或签署区。
- 将经过确认的正式文书视觉语言复用于新文档。

Do not use it when:

- 用户需要的是营销报告、产品白皮书、科技感提案或普通商务汇报；这些属于通用文档风格，不应套用公文版式。
- 用户只需要 Markdown、网页或纯文本草稿，不关心打印版式。
- 用户要求伪造公章、签名、政府机关标志、发文字号或真实机关文件。
- 用户要求从网盘、破解站或授权不明来源下载方正、微软等商业字体。

## Design principle

The suite contains two presets that share a restrained formal language but must remain separate:

| Preset | Primary goal | Typical output |
|---|---|---|
| `formal-government` | 规范版心、要素位置、标题层级、页码和版记 | 通知、请示、报告、函 |
| `formal-contract` | 条款可编辑性、编号稳定、表格清晰、签署与附件完整 | 合同、协议、服务条款 |

Do not force both presets into one layout. Government documents optimize for format rules; contracts optimize for revision, negotiation, and signature.

## Renderer split

Use independent renderers instead of converting one final format into the other:

| Output | Primary renderer | Why |
|---|---|---|
| PDF | Typst | Stable pagination, embedded fonts, deterministic print layout |
| DOCX | OfficeCLI | Native Word structure, editable styles, fields, tables and headers/footers |
| HTML/CSS PDF | WeasyPrint | Secondary path when an existing HTML template must be reused |
| Draft conversion | Pandoc | Content bridge only; not the final visual renderer |

The DOCX and PDF should share:

- Structured content and section order.
- Typography roles and design tokens.
- Numbering semantics.
- Source links, dates and legal notices.

They do not need identical line breaks or page counts. Word is a flowing layout engine; Typst is a fixed-page compositor.

If the user requires page-for-page identity, make DOCX the source of truth and export PDF through Word, WPS or LibreOffice on the target environment.

## Required setup

Required for the normal workflow:

- Typst 0.15 or newer.
- OfficeCLI with DOCX create/edit, validation, issue scanning and screenshot support.
- Fontconfig commands such as `fc-match` when checking local fonts.
- A PDF inspection tool such as `pdfinfo`, `pdffonts` and `pdftoppm`.

Check availability:

```bash
typst --version
officecli --version
fc-match "Noto Serif CJK SC"
pdfinfo -v
pdffonts -v
```

Do not silently install packages unless the user has asked for environment setup.

## Font modes

Always distinguish two modes.

### Portable mode

Use legally redistributable fonts for preview, internal circulation and cross-platform output.

Recommended mapping:

| Formal role | Primary portable font | Alternative |
|---|---|---|
| Government title / 小标宋风格 | `FandolSong Bold` | `Noto Serif CJK SC Bold` |
| Government body / 仿宋风格 | `FandolFang` | `Noto Serif CJK SC` |
| Level-one heading / 黑体风格 | `FandolHei` | `Noto Sans CJK SC Bold` |
| Level-two heading / 楷体风格 | `FandolKai` | `LXGW WenKai` |
| Contract body | `Noto Serif CJK SC` | `FandolSong` |
| Contract headings | `Noto Sans CJK SC` | `FandolHei` |

Known open font packages on macOS/Homebrew:

```bash
brew install --cask \
  font-noto-sans-cjk-sc \
  font-noto-serif-cjk-sc \
  font-fandol \
  font-lxgw-wenkai
fc-cache -f -v
```

Verify actual family names instead of assuming aliases:

```bash
fc-match -f '%{family}\n%{file}\n' 'Noto Sans CJK SC'
fc-match -f '%{family}\n%{file}\n' 'Noto Serif CJK SC'
fc-match -f '%{family}\n%{file}\n' 'FandolFang'
fc-match -f '%{family}\n%{file}\n' 'FandolKai'
fc-match -f '%{family}\n%{file}\n' 'FandolSong:style=Bold'
typst fonts | grep -E 'Noto|Fandol|LXGW'
```

### Strict mode

Use strict mode only when the user provides legally licensed fonts or confirms they are already installed and licensed for the intended output.

Typical strict roles include:

- 方正小标宋简体／方正小标宋 GBK.
- 仿宋 or 仿宋_GB2312.
- 楷体 or 楷体_GB2312.
- 黑体／SimHei.
- 宋体／SimSun.

Never obtain these from school attachments, font mirrors, cloud-drive shares or unofficial font websites. Do not claim portable substitutes are exact clones. Font substitution changes glyph widths, wrapping and pagination.

## Workflow

### 1. Confirm document type and output contract

Before writing content, determine:

- Preset: `formal-government` or `formal-contract`.
- Required outputs: DOCX, PDF, or both.
- Font mode: `portable` or `strict`.
- Whether content is final, sample data, or a reusable template.
- Whether the PDF must match the DOCX page-for-page.
- Destination directory and whether build artifacts must stay outside it.

For samples, use entirely fictional parties, organizations, addresses, numbers, dates and contact details. Mark the document as a test/sample where appropriate.

### 2. Build a shared content model

Represent content structurally before rendering. At minimum include:

```text
document
├── metadata
│   ├── title
│   ├── identifier
│   ├── author_or_parties
│   ├── date
│   └── font_mode
├── sections[]
│   ├── level
│   ├── number
│   ├── title
│   └── blocks[]
├── tables[]
├── attachments[]
└── signature_or_record_block
```

Do not encode alignment with repeated spaces, blank paragraphs or underscore characters. Use styles, tables, fields and layout components.

### 3. Render PDF with Typst

Use A4 unless the user specifies otherwise. Define fonts and layout tokens at the top of the Typst source. Use automatic counters or structured headings rather than hardcoded visual positioning.

Compile:

```bash
typst compile input.typ output.pdf
```

Inspect:

```bash
pdfinfo output.pdf
pdffonts output.pdf
pdftotext output.pdf -
pdftoppm -png -r 96 output.pdf /tmp/output-page
```

The PDF must embed or subset the intended fonts. Treat an unknown font warning as a failed font setup, not a harmless warning.

### 4. Render native DOCX with OfficeCLI

Before mutating a DOCX, load the OfficeCLI Word build guide and inspect element schemas when needed:

```bash
officecli load_skill word
officecli help docx document
officecli help docx style
officecli help docx paragraph
officecli help docx footer
officecli help docx table
```

Create styles first, then content. Prefer a single `batch` operation for multiple mutations. Use:

- Word paragraph styles for body and heading roles.
- `font.ea` for East Asian font slots.
- Real PAGE and NUMPAGES fields in footers.
- `keepNext`, `keepLines` and `pageBreakBefore` instead of manual blank lines.
- Tables for party metadata, milestones and signature blocks.
- `updateFields=true` so Word refreshes field values on open.

OfficeCLI accepts physical lengths for indentation. Do not pass CSS units such as `2em` where the schema expects a length. Approximate two Chinese characters with a tested physical value based on the font size, then verify visually.

Finish every DOCX mutation session with:

```bash
officecli save output.docx
```

### 5. Apply the selected preset

For government documents, follow `references/government-layout.md`.

For contracts, follow `references/contract-layout.md`.

### 6. Run the delivery gate

Follow `references/qa-checklist.md`. A file is not complete merely because it compiles or opens.

At minimum:

```bash
officecli validate output.docx --json
officecli view output.docx issues --json
officecli view output.docx text
officecli view output.docx screenshot --grid auto

git diff --check  # when templates or skill files are changed in a repository
```

For PDF, verify page size, page count, embedded fonts, extractable text and full-page renders.

## Safety and authenticity

- Never fabricate a seal, signature, government emblem, approval status or official identity.
- Do not make a sample look like an authentic issued government document without a visible test/sample indication.
- Do not include real personal data, confidential contract information or unpublished commercial terms in a public repository.
- Treat user-provided assets and document contents as potentially sensitive. Keep temporary renders outside public repositories.
- Do not log or expose font license files, private document contents or hidden metadata without need.
- Strip personal metadata from generated DOCX when appropriate.

## Failure handling

- **Unknown font or fallback:** stop, run `fc-match` and `typst fonts`, then use an exact installed family name.
- **DOCX pagination differs by machine:** explain that Word pagination depends on fonts and renderer; verify on the target application when page identity matters.
- **Heading isolated at page bottom:** apply `keepNext` or an unbreakable Typst block.
- **Signature table splits:** put the signature component in an unbreakable block or keep the heading, note and table together.
- **Attachment label occupies a page alone:** check for duplicate `pageBreakBefore` on both the label and attachment title.
- **Unexpected blank record page:** remove redundant forced page breaks and place the record block at the bottom of the final page where appropriate.
- **OfficeCLI issue scanner reports mixed punctuation:** use intentional full-width Chinese punctuation where required; do not ignore issue output without inspecting it.
- **Typst compiles but visual density is wrong:** render all pages and adjust paragraph leading, inter-paragraph spacing and heading block spacing separately.
- **WeasyPrint renders untrusted HTML:** use a restricted URL fetcher or isolation. Do not allow arbitrary local-file reads or unrestricted network requests.

## Completion report

When delivering, report:

- Exact output paths.
- Preset and font mode.
- Renderers used for DOCX and PDF.
- Validation and visual audit results.
- Whether strict fonts were unavailable.
- Any expected DOCX/PDF pagination differences.
- Whether commit or push was intentionally skipped.
