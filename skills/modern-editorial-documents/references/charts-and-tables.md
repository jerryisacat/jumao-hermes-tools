# Charts and tables

## General rule

Use charts to reveal patterns and tables to support precise comparison. Do not include both unless they answer different reading needs.

## Chart palette

Default order:

1. Primary: `#3157D5`.
2. Secondary: `#7C93DD`.
3. Neutral dark: `#66707A`.
4. Neutral light: `#C7CED6`.
5. Alert: `#C43D3D`, only for risk/negative semantics.

Do not use rainbow palettes for categorical data unless the categories are impossible to distinguish otherwise.

## Column/bar charts

Use for category comparison.

- Start quantitative axes at zero unless a different baseline is explicitly justified.
- Sort categories when order is not inherently meaningful.
- Use direct values when there are few bars.
- Prefer one highlighted series plus muted comparisons.
- Remove chart-area borders and heavy axis lines.
- Use light gray grid lines.

## Line charts

Use for time, stage or maturity progression.

- Limit the number of series.
- Use visible markers when there are only a few points.
- Do not smooth a line if smoothing implies measurements that do not exist.
- Keep labels readable and avoid steep rotations.
- Use captions to state when the values are illustrative.

## Pie and doughnut charts

Avoid by default. Use only when:

- The whole is meaningful.
- There are no more than about five categories.
- Values clearly sum to 100%.

Prefer a sorted bar chart for close comparisons.

## Native DOCX charts

Prefer OfficeCLI native charts:

```bash
officecli add "$FILE" /body --type chart \
  --prop chartType=line \
  --prop title="价值成熟度趋势（示例数据）" \
  --prop categories="概念验证,单点应用,流程嵌入,跨部门协同,规模运营" \
  --prop data="成熟度指数:18,32,50,70,86" \
  --prop colors=3157D5 \
  --prop preset=minimal \
  --prop legend=none \
  --prop marker=circle:7:3157D5 \
  --prop linewidth=2.5 \
  --prop smooth=false \
  --prop width=16cm \
  --prop height=6.2cm
```

Benefits:

- Editable data and labels.
- Theme-aware text.
- Better accessibility than a screenshot.
- Viewer can inspect and update the chart.

Use SVG/PNG only when Office charts cannot represent the required visualization. Always add alt text.

## Typst charts

Typst may embed an SVG produced by a deterministic local script. The SVG must:

- Use the shared palette and typography.
- Include a title/description or be paired with a visible caption.
- Avoid decorative gradients and shadows.
- Use explicit dimensions/viewBox.
- Be stored with temporary source assets or curated into the skill/tool intentionally.

## Table principles

- Use a light gray header for most tables.
- A blue header is acceptable for one primary roadmap/action table.
- Use 0.4–0.6 pt gray hairlines.
- Avoid thick black full-grid borders.
- Align numbers consistently, usually right.
- Keep labels left aligned.
- Repeat header rows across pages in DOCX.
- Prevent rows from splitting where possible.
- Write complete cell text; do not rely on color or icons alone.
- Use zebra striping only when it materially improves scanning.

## Captions and sources

Every chart should have:

- A figure number.
- Descriptive caption.
- Source or sample-data declaration.

Every factual chart should also document:

- Source URL/publication.
- Access date when relevant.
- Unit and scope.
- Any transformation or normalization.

## QA

Check:

- Chart title and labels are readable at normal page zoom.
- Axis bounds do not mislead.
- Series colors match across PDF and DOCX.
- Category order matches the shared data model.
- Captions are kept with their chart/table.
- Table cells do not overflow or truncate.
- Native DOCX charts remain editable.
- Sample data is visibly labeled.
