# First-version validation

Completed locally:

- HTML generation and JavaScript syntax checking.
- All local page, stylesheet, script and image references resolve.
- Public text and filenames checked for employer and internal-engine identifiers.
- Stereo sampling checked against forward field-of-view and depth limits.
- LiDAR ray tests verify first-surface occlusion, no fabricated free-space returns, and visibility changes of the moving target.
- Rendered and visually inspected conceptual diagrams at desktop and narrow widths.
- Layer-render changes and play/pause state checked in the canvas-only harness.
- Exact page content packaged into the self-contained `preview.html`, including navigation between the four cases.

Pending before final publication verification:

- Full browser layout and interaction checks, including mobile widths and reduced motion. The local browser binary could not be installed in the current environment, so `tools/check.mjs` has not passed here.
- Live GitHub Pages deployment and HTTP checks at the final address.

The canvas-only checks are intentionally not reported as browser tests. Responsive CSS and accessible controls are implemented, but their final browser review remains outstanding.
