# Contract layout reference

## Scope

This reference defines the `formal-contract` preset for Chinese contracts and agreements. The goal is a restrained, printable and editable legal document—not a decorative proposal.

## Page geometry

Recommended defaults:

| Token | Value |
|---|---|
| Paper | A4, portrait |
| Top/bottom margin | 25–28 mm |
| Left margin | 28–30 mm |
| Right margin | 25–28 mm |
| Body size | 10.5–12 pt |
| Line spacing | 1.4–1.6× |
| Paragraph spacing | 6–8 pt |

Adjust for the actual contract length. Do not compress a long contract into tiny type merely to reduce page count.

## Typography

Portable defaults:

| Element | Font | Size |
|---|---|---|
| Cover title | Noto Sans CJK SC Bold | 24–28 pt |
| Cover subtitle | Noto Sans CJK SC Bold | 14–16 pt |
| Body | Noto Serif CJK SC | 10.5–12 pt |
| Primary clause | Noto Sans CJK SC Bold | 13–15 pt |
| Secondary clause | Noto Sans CJK SC Bold | body size |
| Notes/metadata | Noto Sans CJK SC | 9–10 pt |
| Footer | Noto Serif CJK SC | 9 pt |

Use Fandol equivalents only when their metrics and coverage have been verified for the document.

## Structure

A reusable contract should model:

1. Contract number.
2. Cover title and project name.
3. Party names and signing metadata.
4. Recital/introduction.
5. Numbered clauses.
6. Service scope or subject matter.
7. Milestones and deliverables.
8. Price and payment.
9. Rights and obligations.
10. Confidentiality and data security.
11. Intellectual property.
12. Acceptance and change control.
13. Breach, force majeure and dispute resolution.
14. Other provisions.
15. Attachment list.
16. Independent signature page.
17. Attachments.

This is a layout model, not legal advice. Do not invent required legal terms or claim enforceability.

## Numbering

Prefer native semantic numbering:

```text
第一条
1.1
1.1.1
```

Use Typst counters or Word native multilevel lists when the content will change frequently. Avoid hardcoded numbering for long negotiated documents.

If a short test document uses literal numbering, verify the full sequence after every insertion or deletion.

## Tables

Use tables for:

- Party information.
- Milestones and deliverables.
- Payment schedules.
- Acceptance criteria.
- Responsibility matrices.
- Signature blocks.

Rules:

- Use fixed column widths for predictable DOCX layout.
- Repeat header rows when tables cross pages.
- Avoid decorative dark fills; use light gray headers and thin neutral borders.
- Prevent signature tables from splitting.
- Keep cell padding sufficient for handwriting and stamps when applicable.

## Signature page

The signature page is a structural component, not a collection of blank lines.

- Start it on a new page when the contract requires an independent signature page.
- Keep title, “以下无正文” note and table together.
- Use a two-column table for bilateral agreements.
- Provide real vertical room for signatures and seals.
- Use fields/cells for dates instead of repeated underscores when editable controls are available.
- Never create fake signatures or seals.

## Footer

Default contract footer:

```text
第 X 页 / 共 Y 页 · CONTRACT-ID
```

For DOCX, use PAGE and NUMPAGES fields and set `updateFields=true`. For PDF, use the page counter. The cover can suppress its visible page number while remaining part of the total count, or the body can restart at page 1 if the user specifies that convention.

## Watermark

A sample contract may use a restrained diagonal watermark such as `测试草案`.

- Keep opacity low enough that body text remains legible.
- Ensure the watermark does not obscure signature fields.
- Do not add a draft watermark to a final document unless requested.
- Do not use a watermark to imitate an official seal.

## Visual prohibitions

Do not use:

- Marketing-style hero sections.
- Gradient covers.
- Rounded information cards.
- Decorative icons.
- Large colored sidebars.
- Excessive brand color.
- Tiny type to force fewer pages.
- Manual spacing made from repeated spaces or empty paragraphs.
