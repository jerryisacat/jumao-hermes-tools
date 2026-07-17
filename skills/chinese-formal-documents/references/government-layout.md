# Government document layout reference

## Scope

This reference defines the `formal-government` preset. It uses GB/T 9704—2012 as the layout baseline, but strict compliance still depends on document type, official assets, licensed fonts and the issuing organization's requirements.

## Page geometry

Default A4 geometry:

| Token | Value |
|---|---|
| Paper | 210 × 297 mm |
| Top margin / 天头 | 37 mm |
| Bottom margin | 35 mm |
| Left margin / 订口 | 28 mm |
| Right margin | 26 mm |
| Text area / 版心 | 156 × 225 mm |
| Baseline target | about 22 lines per page |
| Character target | about 28 full-width characters per line |

Do not claim exact 22 × 28 conformance until the final font and renderer have been measured. Portable font metrics differ from strict government fonts.

## Typography roles

Strict conventional roles:

| Element | Conventional role | Approximate size |
|---|---|---|
| Issuing authority mark | 小标宋 | project-specific |
| Main title | 2号小标宋 | about 22 pt |
| Body | 3号仿宋 | about 16 pt |
| Level-one heading | 3号黑体 | about 16 pt |
| Level-two heading | 3号楷体 | about 16 pt |
| Level-three/four heading | 3号仿宋, bold when needed | about 16 pt |
| Record block / 版记 | 4号仿宋 | about 14 pt |
| Page number | 4号半角宋体 | about 14 pt |

Portable mapping:

| Element | Portable font |
|---|---|
| Issuing authority mark/title | FandolSong Bold or Noto Serif CJK SC Bold |
| Body | FandolFang or Noto Serif CJK SC |
| Level-one heading | FandolHei or Noto Sans CJK SC Bold |
| Level-two heading | FandolKai or LXGW WenKai |
| Record/page number | FandolSong or Noto Serif CJK SC |

## Heading hierarchy

Use the Chinese hierarchy consistently:

```text
一、
（一）
1．
（1）
```

Prefer full-width punctuation in formal Chinese text where the checker or house style requires it. Do not mix `1.` with Chinese punctuation casually.

## Core elements

A representative document can contain:

1. Issuing authority mark.
2. Red separator line when appropriate.
3. Document number.
4. Main title.
5. Primary recipient.
6. Body and heading hierarchy.
7. Attachment note.
8. Issuer/signature and date.
9. Attachment label and title.
10. Record block.
11. Outside-positioned page numbers.

Do not invent real identities or identifiers for samples.

## Page numbers

Use the government style:

```text
— 1 —
```

When odd/even pages are enabled, position the page number on the outside edge. Do not use `Page X of Y` for the government preset unless the user explicitly requests a non-standard internal document.

## Attachments

- Start the attachment on a new page when it is a separate formal component.
- Keep the attachment label with the attachment title.
- Do not set `pageBreakBefore` on both the label and title; that creates a label-only page.
- Repeat table headers when a long attachment table crosses pages.
- Keep the attachment name consistent between the body note and the attachment page.

## Record block

The record block should read as the final archival element rather than ordinary body text.

- Use horizontal rules or table borders rather than underscore characters.
- Avoid repeated spaces for left/right alignment; use a grid or table.
- Keep it at the bottom of the final page when practical.
- Avoid forcing a nearly empty record-only page unless the document format explicitly requires it.

## Visual prohibitions

Do not use:

- Gradients or shadows.
- Rounded cards.
- Large decorative color fields.
- Internet-product landing-page layouts.
- Decorative icons in formal elements.
- Fake seals, signatures or emblems.
- A generic AI-template sidebar or colored left rail.
