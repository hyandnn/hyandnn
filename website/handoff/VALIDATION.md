# Second-version validation

Completed locally:

- Generated 12 static pages: homepage, four cases and 404 in two languages.
- JavaScript syntax checks and local page/asset references.
- Language metadata and paired links: switching preserves the current case.
- Public text and filenames checked for employer and internal-engine identifiers.
- Stereo sampling checked against forward field of view and depth limits.
- LiDAR ray checks: first-surface occlusion, no fabricated free-space returns, and changing target visibility.
- Climbing checks: immutable wall points, an upward-moving window, changing visible subsets, invertible local-to-template mapping and speed derived from the same trajectory.
- Dedicated cover compositions and all collision/climbing phase panels rendered and inspected at desktop and narrow widths.
- Actual app behavior checked with a DOM shim: English/Chinese controls, shared phase playback, scrubbing, replay, reduced-motion pause and saved language selection.
- Offline preview shell checked for navigation to the same case across languages.
- Exact pages packaged into the self-contained bilingual `preview.html`.

Pending before final publication verification:

- Full browser layout/interaction checks, including actual Chinese system-font rendering, language preference persistence, mobile widths and reduced motion. The environment lacks a usable browser binary, so `tools/check.mjs` has not passed here.
- Live GitHub Pages deployment and HTTP checks at the final address.

Canvas-only and static checks are not reported as full browser tests. The responsive layout and bilingual behavior are implemented; final browser review remains outstanding.
