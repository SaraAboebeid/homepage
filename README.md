# TechnoArt Static Site

YAML‑driven static site with a WebGL Bayer dithering background (inspired by https://tympanus.net/Tutorials/BayerDithering/circles/).

## Overview
The site’s textual + structural content lives in a single source of truth: `content.yaml`. Running the generator (`generate.js`) rebuilds every HTML page from that YAML while preserving shared styling (`styles.css`) and interactive behavior (`script.js`, `background.js`).

## Quick Start
```bash
npm install      # install js-yaml
npm run build    # regenerate *.html from content.yaml
```
Open any of the generated HTML files in a browser (or serve via a simple static server).

## Content Model (`content.yaml`)
Top-level keys:
- `site`: global metadata (name, navigation, defaults)
- `pages[]`: array of page objects
	- `file`: output HTML filename
	- `head.title` / `head.meta.description`
	- `hero`: hero heading text
	- `sections[]`: ordered content sections with `heading` + multiline `body`
- `background`: shared palette + per‑page background rendering config consumed by `background.js`
- `ui`: theme tokens + animation & control defaults
- `meta`: provenance info (non-functional)

## Regeneration Flow
1. Edit `content.yaml`.
2. Run `npm run build`.
3. Commit regenerated HTML (or add them to `.gitignore` if you want build artifacts excluded).

`generate.js` performs a direct transform—no templating library—so it’s easy to extend. Each run overwrites existing target HTML files.

## Extending the Generator
Ideas:
- Support Markdown in section bodies (e.g. integrate `marked` or `markdown-it`).
- Inject background config (e.g. data attributes) per page based on `background.pages` to let `background.js` auto-pick without filename matching.
- Add sitemap / RSS generation.
- Split long paragraphs into multiple `<p>` tags (currently each section body becomes a single `<p>` after trimming).
- Add build hash / generation timestamp comment to each file for cache busting.

## Background System
`background.js` builds a Bayer dithering WebGL layer (Three.js). Per-page visual differences are keyed off the filename and palette definitions in `background.pages`. If you shift to data attributes, you can decouple from filenames.

## Theming & Preferences
`script.js` implements:
- Theme toggle (light/dark) + persisted choice.
- Dither parameter control panel (pattern seed, cell size, tones, shape, speed, parallax, etc.).
- Reduced motion & high contrast preference classes.

Defaults for these live in `ui.settingsDefaults` (YAML) and are mirrored in `script.js`; you can DRY this by emitting a small JSON script tag from the generator if desired.

## Contributing Workflow
1. Update `content.yaml`.
2. Run build.
3. Manually test pages (focus order, theme toggle, background performance).
4. Commit changes.

## Potential Next Steps
- Add a watch mode (e.g. tiny `nodemon` or a custom file watcher) for live regeneration.
- Add automated accessibility checks (Pa11y / axe) to CI.
- Extract repeated HTML head + layout into string templates for clarity.
- Move large shaders into separate `.glsl` files (then inline during build) for editor syntax highlighting.

## License / Attribution
Original dithering inspiration: Tympanus tutorial linked above. All other code © current repository owner unless stated otherwise.
