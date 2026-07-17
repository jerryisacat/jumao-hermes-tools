# Modern editorial QA checklist

A modern editorial document is complete only after structural, content and visual verification.

## 1. Scope and truth

- [ ] Audience and document purpose are explicit.
- [ ] Output formats and destination are explicit.
- [ ] Page range is appropriate for the request.
- [ ] Sample data is visibly identified as illustrative.
- [ ] Factual claims have sources and dates where needed.
- [ ] No fictional case is presented as a real organization.
- [ ] Confidential/user data is not copied into public repositories.

## 2. Shared content model

- [ ] DOCX and PDF have the same section order.
- [ ] Titles, labels, table values and chart values agree.
- [ ] Version, date and disclaimer agree.
- [ ] PDF/DOCX pagination differences are expected and documented.
- [ ] No spacing, blank-line chains or underscore runs are used as layout primitives.

## 3. Typography

- [ ] Heading font is Noto Sans CJK SC or an approved replacement.
- [ ] Long-form body uses Noto Serif CJK SC unless `sans-body` is intentional.
- [ ] Cover title has no orphan character or accidental one-word line.
- [ ] Body text is normally 10.5–11 pt and never reduced below 9 pt to force pagination.
- [ ] Captions remain readable at normal zoom.
- [ ] Heading levels are visually and structurally distinct.
- [ ] No missing glyph boxes or obvious fallback mismatch.

## 4. Layout

- [ ] Page size and margins are intentional.
- [ ] Body reading path is stable and primarily single-column.
- [ ] Cover is at least about 60% filled with meaningful content and balanced spacing.
- [ ] Last page is at least about 40% filled unless intentionally designed otherwise.
- [ ] No accidental blank page.
- [ ] No isolated heading at the bottom of a page.
- [ ] No clipped or overlapping text.
- [ ] No table or chart extends beyond the content area.
- [ ] Page header/footer does not appear on the cover unless intended.
- [ ] Page fields are live rather than literal numbers when appropriate.

## 5. Components

- [ ] Executive summary fits on one page when practical.
- [ ] Metric blocks contain value, label and interpretation.
- [ ] Contents entries align and match actual sections.
- [ ] Chapter openings share the page with useful content in short reports.
- [ ] Cards are reserved for metrics, cases and comparisons—not ordinary prose.
- [ ] Callouts are used sparingly.
- [ ] Quotes have attribution.
- [ ] Risk levels include text, not color alone.
- [ ] Roadmap entries contain concrete actions and deliverables.

## 6. Charts and tables

- [ ] Chart data matches the shared content model.
- [ ] Chart titles and captions are present.
- [ ] Sources or sample-data notes are visible.
- [ ] Native DOCX charts remain editable.
- [ ] Axes and baselines are not misleading.
- [ ] Color palette is restrained and consistent.
- [ ] Tables use light hairlines rather than thick black grids.
- [ ] Header contrast is sufficient.
- [ ] No truncated cell text.
- [ ] Tables do not split awkwardly across pages.

## 7. DOCX gate

Run:

```bash
officecli validate report.docx --json
officecli view report.docx issues --json
officecli view report.docx outline
officecli view report.docx text
officecli view report.docx stats --json
officecli view report.docx screenshot --grid auto
officecli save report.docx
```

Reject if:

- Validation returns errors.
- Issues contain unresolved delivery problems.
- Heading hierarchy skips or flattens levels.
- Placeholder tokens remain.
- A chart/image lacks required description/alt text.
- PAGE fields are missing from a multi-page document.
- Screenshot rendering reveals blank pages, clipping, overflow or orphaned titles.

Field results may be stale until Word recalculates them. Verify field structure and set `updateFields=true`; do not replace fields with guessed values.

## 8. PDF gate

Run:

```bash
typst compile report.typ report.pdf
pdfinfo report.pdf
pdffonts report.pdf
pdftotext report.pdf -
pdftoppm -png -r 96 report.pdf /tmp/report-page
```

Reject if:

- Compile returns a warning about required fonts or fails.
- Page size is wrong.
- Fonts are not embedded.
- Text extraction fails or important text is missing.
- Any page contains overflow, clipping, overlap or accidental blank space.
- The cover title wraps into an orphan character.
- A chart, table or caption is separated unexpectedly.

## 9. Visual audit

Review a full-document contact sheet first. Then inspect suspect pages at full resolution.

Adversarially inspect:

- Cover title wrapping.
- Executive-summary density.
- Contents alignment.
- Chapter-title rhythm.
- Chart label size and palette.
- Table border weight.
- Case-card height balance.
- Quote and attribution proximity.
- Warning contrast.
- Last-page density.
- Header/footer consistency.

After any visual fix, rerun the relevant schema/content checks and re-render the affected pages.

## 10. Handoff

- [ ] Final directory contains only requested deliverables.
- [ ] Temporary sources, screenshots and logs are stored outside the delivery directory.
- [ ] Exact file paths are reported.
- [ ] Page counts and renderers are reported.
- [ ] Font embedding and DOCX validation results are reported.
- [ ] Visual audit status is reported.
- [ ] Data status (real or illustrative) is reported.
- [ ] Any unverified viewer-specific behavior is disclosed.
- [ ] Commit/push status is disclosed when working in a repository.
