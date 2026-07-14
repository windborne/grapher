# Agent notes

## Version bumps & releases

Merging ≠ releasing: `npm publish` is the release.

- NEVER bump the version inside a feature PR.
- The publisher bumps on `main` after merge, as a standalone commit:
  1. `npm version patch --no-git-tag-version` — never hand-edit (`package.json` alone desyncs the lockfile)
  2. Commit message: the bare version number (e.g. `1.1.2`). No git tags.
  3. `npm ci && npm run build` — manual; no `prepublishOnly` hook. Needs Rust + wasm-pack.
  4. `npm publish` — needs @windborne npm org membership (separate from GitHub org) + 2FA OTP.
- If the build regenerates `src/rust/pkg/index.js`, commit it — it must pair with `index_bg.wasm` from the same build.
