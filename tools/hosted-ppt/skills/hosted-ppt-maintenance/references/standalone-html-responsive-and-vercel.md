# Standalone HTML pages for hosted-ppt

Conventions for a `hosted-ppt` repository deployed on Vercel.

## Vercel import settings

Use the repo as a static site:

| Vercel field | Value |
|---|---|
| Framework Preset | `Other` |
| Root Directory | `./` or blank |
| Build Command | blank |
| Output Directory | `.` |
| Install Command | blank |
| Development Command | blank |

## Homepage / directory behavior

- `/` is the directory page and is email-gated.
- Directory links into standalone pages under `/talks/<slug>/`.
- Standalone pages must not include a "back to directory" link, root link, or `/talks/` directory link.
- Direct standalone page URLs are intended to be shareable.

## Mobile scaling for fixed 1600×900 decks

Many generated presentation HTML files use fixed `.slide { width: 1600px; height: 900px; }`. They need viewport scaling for phones.

Pattern:

1. Keep `<meta name="viewport" content="width=device-width, initial-scale=1" />`.
2. Add CSS:

```css
.slide-shell {
  width: 100%;
  height: 900px;
  overflow: hidden;
}

@media screen {
  body { overflow-x: hidden; }
  .slide { transform-origin: top left; }
}

@media print {
  .slide-shell { height: 900px !important; overflow: visible; }
  .slide { transform: none !important; margin: 0 auto !important; }
}
```

3. Add JS before `</body>`:

```html
<script>
  (function () {
    const SLIDE_WIDTH = 1600;
    const SLIDE_HEIGHT = 900;

    function wrapSlides() {
      document.querySelectorAll('body > section.slide').forEach((slide) => {
        const shell = document.createElement('div');
        shell.className = 'slide-shell';
        slide.parentNode.insertBefore(shell, slide);
        shell.appendChild(slide);
      });
    }

    function resizeSlides() {
      const scale = Math.min(1, window.innerWidth / SLIDE_WIDTH);
      document.querySelectorAll('.slide-shell').forEach((shell) => {
        shell.style.height = `${SLIDE_HEIGHT * scale}px`;
      });
      document.querySelectorAll('.slide').forEach((slide) => {
        slide.style.transform = `scale(${scale})`;
        slide.style.margin = scale === 1 ? '0 auto' : '0';
      });
    }

    wrapSlides();
    resizeSlides();
    window.addEventListener('resize', resizeSlides, { passive: true });
    window.addEventListener('orientationchange', resizeSlides, { passive: true });
  })();
</script>
```

## Verification evidence to collect

- HTML parser confirms expected slide count.
- Homepage contains a link to `/talks/<slug>/`.
- Standalone page contains `.slide-shell`, `SLIDE_WIDTH = 1600`, and `orientationchange` when fixed slide canvas is present.
- Standalone page has no `href="/"`, `href='/ '`, or `/talks/` directory link.
- Local HTTP probe returns 200 `text/html`.
- Optional browser probe: at desktop width, scale matches `window.innerWidth / 1600` when under 1600; simulate phone width or use a mobile viewport if available.
