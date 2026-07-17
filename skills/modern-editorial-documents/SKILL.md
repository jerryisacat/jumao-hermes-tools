---
name: modern-editorial-documents
description: "Use when creating, editing, or validating modern Chinese reports, proposals, white papers, research briefs, and other long-form DOCX/PDF documents with restrained editorial design."
version: 1.0.0
author: jerryisacat
license: MIT
metadata:
  hermes:
    tags: [document, report, proposal, whitepaper, docx, pdf, typst, officecli, editorial, chinese, charts]
---

# Modern Editorial Documents

## When to use

Use this skill when the user asks to create or revise:

- 调研报告、研究简报或行业分析。
- 项目方案、合作提案或商业计划。
- 产品白皮书、技术说明或 AI 应用报告。
- 工作总结、内部汇报材料或决策备忘录。
- 同时需要可编辑 DOCX 和稳定版式 PDF 的长文档。
- 强调“现代、克制、适合长时间阅读”的通用中文文档。

Do not use it when:

- 用户需要政府公文、通知、请示、合同或协议；使用 `chinese-formal-documents`。
- 用户需要演示文稿或幻灯片；使用 PPTX/slide 相关技能。
- 用户只需要网页落地页、营销海报或社交媒体图片。
- 用户明确要求赛博朋克、霓虹、游戏 UI 或强装饰视觉。
- 用户只需要纯文本或 Markdown 草稿，不关心固定版面。

## Positioning

The default style is **Modern Editorial / 现代编辑型**:

- 克制但不古板。
- 现代但不像互联网产品页面。
- 以稳定的单列阅读路径为主。
- 科技感来自网格、编号、数据和版面秩序，不来自霓虹渐变。
- 卡片只服务于摘要、指标、案例和并列比较，不包裹普通正文。
- 同时适合屏幕阅读和 A4 打印。

This is not “formal documents with extra blue”. It is a separate system optimized for comprehension, narrative and information hierarchy.

## Renderer split

Use independent renderers for the two outputs:

| Output | Primary renderer | Requirement |
|---|---|---|
| PDF | Typst | Stable page composition, embedded fonts, deterministic visual layout |
| DOCX | OfficeCLI | Native styles, editable tables/charts, live fields and Word-compatible structure |
| HTML/CSS PDF | WeasyPrint | Secondary path when reusing an existing HTML/CSS report template |
| Draft conversion | Pandoc | Content bridge only, not the final visual renderer |

The PDF and DOCX must share:

- Section order and heading semantics.
- Content, labels, table values and chart data.
- Typography roles and design tokens.
- Data/sample disclaimers.
- Source notes, version and date.

They do not need identical line breaks or page counts. If page-for-page identity is required, make DOCX the source and export its PDF through the target Word-compatible renderer.

## Default dependencies

Required for the primary workflow:

- Typst 0.15 or newer.
- OfficeCLI with DOCX styles, fields, tables, native charts, validation and screenshot support.
- Fontconfig for local font resolution checks.
- Poppler tools such as `pdfinfo`, `pdffonts`, `pdftotext` and `pdftoppm`.

Check availability:

```bash
typst --version
officecli --version
fc-match "Noto Sans CJK SC"
fc-match "Noto Serif CJK SC"
pdfinfo -v
pdffonts -v
```

Do not silently install packages unless the user has asked for environment setup.

## Default design system

Load `references/design-system.md` before implementing a new document or retheming an existing one.

Core defaults:

| Role | Value |
|---|---|
| Paper | A4 portrait |
| Reading path | Single-column body |
| Heading font | Noto Sans CJK SC |
| Body font | Noto Serif CJK SC |
| Primary accent | `#3157D5` |
| Alert accent | `#C43D3D` |
| Main ink | `#1C2025` |
| Secondary text | `#66707A` |
| Hairline | `#DCE1E7` |
| Soft surface | `#F5F7F9` |

Use the red accent only for risk, warning or exception semantics. It is not a second decorative brand color.

## Workflow

### 1. Lock the output contract

Before writing or rendering, determine:

- Document purpose and target reader.
- Required outputs: DOCX, PDF or both.
- Expected page range.
- Whether the content is factual, fictional sample data or a reusable template.
- Whether real citations and current research are required.
- Destination directory.
- Whether DOCX and PDF must match page-for-page.

If the user requests a quick style sample, prefer 6–8 pages. If the user requests a production white paper or research report, do not compress content merely to hit an arbitrary page count.

### 2. Separate content truth from layout testing

For a layout sample:

- Mark the title or metadata as a test/sample document.
- Use fictional organizations, cases, values and timelines.
- State visibly that all figures are illustrative.
- Do not present invented percentages as real research findings.

For a factual report:

- Research and cite current sources before writing conclusions.
- Preserve source URLs, access dates and methodological limits.
- Distinguish observed facts, analysis and recommendations.

### 3. Build a shared content model

Use a renderer-neutral structure:

```text
document
├── metadata
│   ├── title
│   ├── subtitle
│   ├── author
│   ├── date
│   ├── version
│   └── data_disclaimer
├── executive_summary
│   ├── metrics[]
│   ├── judgments[]
│   └── reading_note
├── sections[]
│   ├── number
│   ├── title
│   ├── intro
│   └── blocks[]
├── charts[]
├── tables[]
├── cases[]
├── risks[]
├── roadmap[]
└── appendix
```

Do not encode layout with repeated spaces, blank lines or underscore characters.

### 4. Select page components

Load `references/page-components.md` and use only the components the content needs.

A short 6–8 page sample should normally cover:

1. Cover.
2. Executive summary and contents.
3. Narrative section with chart.
4. Narrative section with trend or comparison.
5. Case or quote page.
6. Risk/governance page.
7. Roadmap and appendix.

Do not add pages solely to display decorative chapter titles or isolated quotes.

### 5. Render PDF with Typst

Define all tokens at the top of the Typst source:

```typst
#let sans = "Noto Sans CJK SC"
#let serif = "Noto Serif CJK SC"
#let blue = rgb("3157D5")
#let red = rgb("C43D3D")
#let ink = rgb("1C2025")
#let muted = rgb("66707A")
#let hairline = rgb("DCE1E7")
#let surface = rgb("F5F7F9")
```

Use explicit page components for chapter openings, metrics, callouts and tables. For an intentional line break in a large Chinese title, use `#linebreak()` instead of relying on automatic wrapping or a backslash escape.

Compile and inspect:

```bash
typst compile report.typ report.pdf
pdfinfo report.pdf
pdffonts report.pdf
pdftotext report.pdf -
pdftoppm -png -r 96 report.pdf /tmp/report-page
```

An unknown-font warning, unembedded font or failed text extraction is a delivery failure.

### 6. Render native DOCX with OfficeCLI

Before DOCX mutation:

```bash
officecli load_skill word
officecli help docx document
officecli help docx style
officecli help docx chart
officecli help docx table
officecli help docx footer
```

Build in this order:

1. Page setup and metadata.
2. Document defaults and theme tokens.
3. Paragraph styles.
4. Cover and metadata.
5. Sections and body content.
6. Tables and native charts.
7. Headers, footers and fields.
8. Validation and visual audit.

DOCX requirements:

- Use `font.ea` for East Asian font slots.
- Use paragraph styles with `outlineLvl` for heading hierarchy.
- Use `pageBreakBefore=true` once per intentional page boundary.
- Use live PAGE/NUMPAGES fields rather than literal page numbers when the total is not fixed.
- Prefer native Office charts to chart screenshots.
- Set image alt text when pictures are necessary.
- Use table cells and tab stops for alignment; never repeated spaces.
- Set `updateFields=true` when fields or TOC need recalculation.
- Finish with `officecli save`.

Example native chart:

```bash
officecli add "$FILE" /body --type chart \
  --prop chartType=column \
  --prop title="行业采用指数（示例数据）" \
  --prop categories="制造,医疗,金融,零售,公共服务" \
  --prop data="采用指数:70,60,50,40,35" \
  --prop colors=3157D5 \
  --prop preset=minimal \
  --prop legend=none \
  --prop width=16cm \
  --prop height=6.5cm
```

Load `references/charts-and-tables.md` for chart and table decisions.

### 7. Apply the delivery gate

Load `references/qa-checklist.md` and verify both formats.

At minimum:

```bash
officecli validate report.docx --json
officecli view report.docx issues --json
officecli view report.docx outline
officecli view report.docx text
officecli view report.docx screenshot --grid auto

git diff --check  # when skill/template files are changed in a repository
```

A successful compile or schema validation is not enough. Inspect every page.

## Visual prohibitions

Do not use:

- Gradient covers or giant blue-purple glows.
- Neon lines, particles or fake technical grids.
- Rounded cards around every paragraph.
- A colored left rail plus unused right-side space.
- Decorative robot, chip or brain illustrations without content value.
- Unexplained English labels.
- One quotation per page merely to inflate length.
- Icons instead of descriptive headings.
- Thick black table grids.
- Body text smaller than 9 pt to force fewer pages.
- Multi-column body text that breaks the reading path.
- Large red and blue decorative fields on the same page.

## Failure handling

- **Cover title creates an orphan character:** add an intentional semantic line break and re-render. Do not accept a one-character final line.
- **Typst backslash does not produce the intended break:** use `#linebreak()` explicitly.
- **DOCX and PDF paginate differently:** treat that as normal unless page identity was required; compare content and hierarchy instead.
- **Native chart is missing in the DOCX preview:** inspect the chart structure and target viewer before replacing it with a screenshot.
- **Chart colors drift across viewers:** use explicit series colors and a minimal preset; verify in the user's target application when color accuracy is critical.
- **Page looks like a dashboard:** remove cards from ordinary prose and restore a single-column narrative.
- **Last page is too empty:** add a meaningful conclusion, next steps, methodology or appendix—not decorative filler.
- **Cover is too empty:** add subtitle, version, audience, date, scope and a restrained test/legal note.
- **Table appears too heavy:** use light gray hairlines and soft header fills; avoid thick full-grid borders.
- **Page density is uneven:** adjust paragraph spacing, chart height and component grouping; do not globally shrink the font.
- **A heading is isolated at the page bottom:** use `keepNext` or an unbreakable Typst block.

## Safety and privacy

- Do not put real confidential reports, customer data, unpublished strategy or credentials into a public repository.
- Treat user-provided business documents as potentially sensitive.
- Keep temporary source files, screenshots and renders outside public repositories unless explicitly curated.
- Remove personal metadata from final DOCX when appropriate.
- Do not claim fictional data is real research.
- Do not imply that generated legal, medical, financial or safety recommendations are professionally certified.

## Completion report

Report:

- Exact output paths.
- Page count observed for each format.
- Renderers used.
- Font families used and whether PDF fonts are embedded.
- DOCX validation/issue counts.
- Full-page visual audit status.
- Whether data is real or illustrative.
- Expected DOCX/PDF pagination differences.
- Whether commit or push was intentionally skipped.
