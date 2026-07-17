# Modern editorial design system

## Positioning

The system is designed for reports, proposals, briefs and white papers that must remain readable for several pages. The visual hierarchy should help the reader understand the argument before noticing the styling.

## Page geometry

Default A4 portrait:

| Token | Default |
|---|---:|
| Top margin | 24 mm |
| Bottom margin | 22 mm |
| Left margin | 25 mm |
| Right margin | 23 mm |
| Header distance | about 12 mm |
| Footer distance | about 12 mm |
| Reading path | Single column |

Use two or three columns only inside bounded comparison components. Do not split normal prose into columns.

## Typography

### Font roles

| Role | Font |
|---|---|
| Cover and chapter headings | Noto Sans CJK SC Bold |
| Subheadings | Noto Sans CJK SC Medium/Bold |
| Long-form body | Noto Serif CJK SC Regular |
| Metrics, tables, captions | Noto Sans CJK SC Regular/Medium |
| English/numeric fallback | Noto Sans or Inter when installed and licensed |

A `sans-body` mode is acceptable for specifications, product manuals and operational documents. Do not mix body modes within one document.

### Size scale

| Role | Default range |
|---|---:|
| Cover title | 30–34 pt |
| Cover subtitle | 14–16 pt |
| Chapter title | 20–23 pt |
| H2 | 14–16 pt |
| H3 | 11.5–12 pt |
| Body | 10.5–11 pt |
| Caption/footnote | 8.5–9 pt |
| Header/footer | 8–9 pt |

Use 1.45–1.6× body line spacing. Prefer 6–8 pt paragraph spacing and no first-line indent for the default block-paragraph mode.

For long narrative prose, a two-character first-line indent may be enabled, but then reduce paragraph spacing. Do not combine a large first-line indent with large paragraph gaps.

## Color tokens

| Token | Hex | Purpose |
|---|---|---|
| Paper | `#FFFFFF` | Page background |
| Ink | `#1C2025` | Primary text |
| Muted | `#66707A` | Secondary text and metadata |
| Hairline | `#DCE1E7` | Rules and table borders |
| Soft surface | `#F5F7F9` | Summary blocks and table headers |
| Primary | `#3157D5` | Chapter numbers, metrics, key chart series |
| Alert | `#C43D3D` | Risk and warning semantics only |

Rules:

- Use one primary accent per document.
- Use gray scale for secondary chart series where possible.
- Do not use red as a decorative counterweight to blue.
- Do not use color to compensate for weak hierarchy.
- Maintain strong contrast for body text and table headers.

## Rules and surfaces

- Dividers: 0.4–0.6 pt in `Hairline`.
- Primary chapter rule: 2–3 pt in `Primary`, short rather than full width.
- Table header: `Soft surface` or `Primary` for a single high-priority roadmap table.
- Callout: `Soft surface` plus a 2–3 pt left rule.
- Corners: square by default; no decorative rounded-card system.
- Shadows: none.
- Gradients: none in the default style.

## Header and footer

For pages after the cover:

- Header left: system/document label in small sans-serif text.
- Header right: shortened report title or current section.
- A single light hairline may separate the header.
- Footer left: data status, confidentiality or version.
- Footer right: live page field and optional total page count.
- The cover normally has neither header nor page number.

## Density

A good page usually contains one main argument plus supporting evidence. It should not become a dashboard merely because it includes data.

Use these checks:

- Cover occupies at least about 60% of the usable page through meaningful content and spacing.
- Last page occupies at least about 40% unless intentionally designed as a closing page.
- No heading is separated from its first paragraph/table/chart.
- A chart should not consume most of a page when it contains only a few values.
- Do not globally reduce type size to resolve one overflowing component.

## Images

Use imagery only when it carries evidence or explains a scenario. Avoid decorative AI-generated backgrounds.

Allowed:

- Product or process screenshots with captions.
- Documentary photography with source and context.
- Functional diagrams and infographics.
- Specific scene illustrations requested by the user.

Avoid:

- Generic robot, chip, circuit, brain or hand imagery.
- Full-page generated backgrounds behind body text.
- Decorative images unrelated to the argument.
