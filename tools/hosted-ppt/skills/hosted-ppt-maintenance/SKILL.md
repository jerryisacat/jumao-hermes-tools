---
name: hosted-ppt-maintenance
description: Maintain a hosted-ppt static HTML presentation repository for Vercel deployment.
---

# Hosted PPT Maintenance

Use this skill when asked to add, update, publish, or troubleshoot HTML/PPT pages in a `hosted-ppt` repository.

## Repository

- Purpose: host standalone HTML presentation/demo pages and deploy them with Vercel.
- Homepage `/` is an email-gated directory linking to standalone pages.
- Standalone pages must not include a "back to directory" link; their direct URLs should remain shareable.

## Adding a supplied HTML file

1. Create a slug directory under `public/talks/`, e.g. `public/talks/my-deck/`.
2. Save/copy the supplied HTML as `index.html` inside that directory.
3. Ensure the HTML has mobile-responsive slide scaling if it uses a fixed 1600×900 slide canvas:
   - Keep `<meta name="viewport" content="width=device-width, initial-scale=1" />`.
   - Add `.slide-shell` CSS and a small script that wraps each `section.slide`, scales `.slide` with `Math.min(1, window.innerWidth / 1600)`, sets shell height to `900 * scale`, and listens for `resize` / `orientationchange`.
   - Do not add directory/back links into standalone pages.
   - Include the tracking script: add `<script src="/tracking.js"></script>` before `</body>` so viewing data is collected (the script auto-detects the slug from the URL and reports page-view / slide-view / session-end events).
4. Add the page to the homepage directory list in `src/web/pages/index.astro` (the `<ul>` inside `.deck-list`).
5. Update README if the repo convention changes.

## Verification

Use ad-hoc verification before publishing. See `references/standalone-html-responsive-and-vercel.md` for Vercel settings, password-directory behavior, and fixed-slide mobile scaling pattern.

For a quick structural check, run the bundled verifier:

```bash
python3 scripts/verify_hosted_ppt_page.py <slug> [expected_slide_count] --repo /path/to/hosted-ppt
```

Also verify:

- Parse the standalone HTML and count expected slide sections.
- Confirm the homepage links to the new page.
- Confirm the standalone page does not link back to `/` or `/talks/`.
- Confirm responsive scaling helper is present for fixed-size slide decks.
- Use a local HTTP server and, when possible, a browser/mobile viewport probe to verify no horizontal overflow.

## Publishing convention

After uploading/adding an HTML page and completing verification, commit and push to `main` so Vercel can deploy. Use the git author identity configured for the repository:

```bash
git add src/web/pages/index.astro public/talks/<slug>/index.html
git commit -m "feat: add <title> presentation"
git push origin main
```

Never print or commit secrets, API keys, or credentials.
