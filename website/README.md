# Merci portfolio

A dependency-free, static portfolio for GitHub Pages. Public project descriptions and independently created synthetic demonstrations. No analytics or third-party runtime services.

## Content and development

- `index.html`: portfolio homepage.
- `projects/*.html`: four detailed engineering case studies.
- `assets/app.js`: independent interactive illustrations; deterministic geometric sampling and ray intersections.
- `assets/style.css`: responsive visual system.
- `tools/build.py`: source for page content and HTML generation.

Edit content in `tools/build.py`, then run `python3 tools/build.py`. CSS and JavaScript are edited directly. Generated pages are checked in, so deployment requires no build service or package installation.

Open `index.html` to preview locally. Publish the root of this folder as the root of the public `hyandnn.github.io` repository. In that repository, enable GitHub Pages under Settings → Pages → Deploy from a branch → main → /(root).

The contact address is explicitly written in the HTML. The visualizations contain illustrative geometry and synthetic time; they do not claim product measurements or reproduce proprietary algorithms.

## Interaction and accessibility

Stereo and LiDAR cases support play/pause, time scrubbing and layer switches. Narrow screens use a combined top view rather than shrinking two panels. Existing research illustrations start as still images and play on request. Reduced-motion preferences are respected. Navigation and controls support keyboard operation.
