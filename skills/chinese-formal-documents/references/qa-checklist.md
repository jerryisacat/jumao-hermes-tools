# Formal document QA checklist

A formal document is complete only after structural, content and visual verification.

## 1. Input and authenticity

- [ ] Document type and preset are explicit.
- [ ] Output formats are explicit.
- [ ] Font mode is explicit: `portable` or `strict`.
- [ ] Sample organizations, parties, identifiers, addresses, dates and amounts are fictional.
- [ ] Sample/test status is visible where confusion with a real document is possible.
- [ ] No seal, signature, emblem or approval status was fabricated.
- [ ] No secret, private data or unpublished commercial term is entering a public repository.

## 2. Fonts

- [ ] Every requested font family resolves to the intended file with `fc-match`.
- [ ] Typst lists the intended families.
- [ ] The PDF embeds or subsets the intended fonts.
- [ ] No unknown-font or fallback warning remains.
- [ ] Portable substitutes are not described as exact strict-font clones.
- [ ] Commercial font licensing is confirmed before strict output.

Commands:

```bash
fc-match -f '%{family}\n%{file}\n' 'FONT FAMILY'
typst fonts | grep 'FONT FAMILY'
pdffonts output.pdf
```

## 3. DOCX schema and content

- [ ] `officecli validate` returns zero errors.
- [ ] `officecli view ... issues` returns zero unresolved issues.
- [ ] Text view contains no `TODO`, `Lorem ipsum`, `xxxx`, template braces or accidental empty markers.
- [ ] East Asian font slots use the intended family.
- [ ] Heading styles have correct hierarchy and outline levels.
- [ ] PAGE/NUMPAGES fields exist where required.
- [ ] `updateFields=true` is set when fields need Word recalculation.
- [ ] The final action is `officecli save`.

Commands:

```bash
officecli validate output.docx --json
officecli view output.docx issues --json
officecli view output.docx text
officecli save output.docx
```

## 4. PDF structure

- [ ] Paper size is A4 unless intentionally different.
- [ ] Page count is plausible.
- [ ] Text extraction works.
- [ ] Fonts are embedded.
- [ ] No unexpected encryption, JavaScript or external dependency exists.

Commands:

```bash
pdfinfo output.pdf
pdffonts output.pdf
pdftotext output.pdf -
```

## 5. Full-page visual audit

Render every page, not just the first page.

```bash
pdftoppm -png -r 96 output.pdf /tmp/output-page
officecli view output.docx screenshot --grid auto
```

Inspect adversarially:

- [ ] No text overlap, clipping or missing glyphs.
- [ ] No title is isolated at the bottom of a page.
- [ ] No nearly blank page was created by duplicate page breaks.
- [ ] Body density is reasonably balanced across adjacent pages.
- [ ] Paragraphs do not become too dense merely to reduce page count.
- [ ] Page numbers are visible and consistent.
- [ ] Tables fit within the text area.
- [ ] Repeating table headers work where needed.
- [ ] Signature title, note and table remain together.
- [ ] Signature rows provide enough space.
- [ ] Attachment label and title remain together.
- [ ] Government record block is not clipped or stranded on an accidental page.
- [ ] Watermarks do not interfere with reading or signing.

## 6. Cross-format consistency

- [ ] DOCX and PDF contain the same sections and clauses.
- [ ] Headings and numbering are semantically consistent.
- [ ] Tables contain the same rows and values.
- [ ] Attachment names match.
- [ ] Dates, identifiers and party names match.
- [ ] Any page-count difference is expected and disclosed.

Do not compare line breaks as a correctness criterion unless the user explicitly requires page-for-page identity.

## 7. Delivery directory

- [ ] Only final requested files are present in the destination.
- [ ] Typst source, screenshots, logs and temporary renders are outside the delivery directory unless requested.
- [ ] File names clearly distinguish preset and format.
- [ ] Final files have non-zero sizes.
- [ ] Exact output paths are reported.

## 8. Completion statement

A valid completion report states:

```text
Preset: formal-government | formal-contract
Font mode: portable | strict
DOCX renderer: OfficeCLI
PDF renderer: Typst
DOCX validation: 0 errors, 0 unresolved issues
Visual audit: all pages checked
Fonts: resolved and embedded
Known difference: DOCX and PDF may paginate differently
```
