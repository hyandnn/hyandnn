# Merci portfolio

A dependency-free static portfolio for GitHub Pages, with full English and Simplified Chinese versions. Public project descriptions and independently created synthetic demonstrations. No analytics or third-party runtime services.

## Content and development

- `index.html` and `projects/*.html`: English homepage and four case studies.
- `zh/index.html` and `zh/projects/*.html`: equivalent Chinese pages.
- `tools/content.py`: paired project text, method diagrams and interface copy.
- `tools/build.py`: static HTML generation.
- `assets/app.js`: independent interactive diagrams and four dedicated cover compositions.
- `assets/style.css`: responsive visual system and system-font stack.
- `tools/preview.py`: self-contained offline preview with navigation between both language versions.

Run `python3 tools/build.py`, then `python3 tools/preview.py` after editing. Generated pages are checked in, so deployment needs no package installation or build service. CSS and JavaScript are edited directly.

Publish this folder’s contents at the root of the public `hyandnn.github.io` repository. Enable GitHub Pages under Settings → Pages → Deploy from a branch → main → /(root). The `handoff` folder is review material and may be omitted from the published website.

## Interaction and accessibility

The EN / 中文 switch preserves the current case and remembers explicit choices when browser storage is available. Ordinary navigation works without JavaScript. English and Chinese page metadata are generated independently. Both languages use system fonts, including SF / Segoe UI and Chinese sans-serif fallbacks.

All four case illustrations support playback and time scrubbing, starting paused. Stereo and LiDAR also have layer switches. The collision and climbing phase panels share one clock; desktop layouts are horizontal, narrow layouts vertical. At the end of a scan, replay restarts on request. Reduced-motion preferences are respected. Navigation and controls support keyboard operation.

## Diagram model

The climbing wall holds have immutable coordinates. An upward-moving camera window determines the visible subset and local frame coordinates. Correspondences link those same local points to fixed template points. The pose is projected from the same wall reference, and normalized speed is derived from the same synthetic trajectory.

The diagrams contain illustrative geometry and synthetic time. They do not reproduce product implementations or provide performance measurements. See `handoff/VALIDATION.md` for completed checks and remaining browser/deployment verification.
