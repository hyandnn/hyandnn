# Deployment handoff

The intended final home is a separate public repository named `hyandnn.github.io`, with the website files at its root. This gives the default address `https://hyandnn.github.io`.

The existing profile repository is used only to review and preserve this first version of the website. It is not a substitute for the separate website repository.

1. Create the public repository `hyandnn.github.io` with an initial README.
2. Copy the contents of this website folder to the root of that repository. The `handoff` folder is review material and can be omitted.
3. In Settings → Pages, choose Deploy from a branch, `main`, `/(root)`.
4. Wait for the Pages deployment to finish, then check the homepage and all four case pages at the real public address.
5. Only after the address is working, replace the profile README with the compact version in `PROFILE-README.md`.

No paid service, custom domain, runtime database, account system or API key is required by this implementation.
