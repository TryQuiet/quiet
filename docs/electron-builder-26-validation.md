# electron-builder 26 develop validation

Validated 2026-09-21 after integrating Electron 44 and develop's New Architecture
and auth 17e0b5b. Host: Linux x64, Node 24.21.0, npm 10.8.2.

- Nine generated launcher/hook tests pass. They execute the actual generated
  shell launcher, including argument quoting, safe library search and sandbox policy.
- Forced source rebuild of msgpackr-extract passes its Unicode round-trip inside
  Electron 44.3.0.
- Production backend, renderer and main builds pass.
- Two consecutive AppImage builds pass shipped-runtime dependency and version
  checks, launcher/desktop-entry checks, SHA-512/size metadata and embedded blockmap.
  The current-version assertion catches the stale extracted-tree failure observed
  with the previous packaging hook.
- After the auth/New Architecture refresh, rebuilt all production inputs and the
  final AppImage; artifact checks and both packaged host-integration E2Es pass.

Headless app tests use Xvfb and the existing explicit test-only sandbox opt-out.
Native Windows/macOS signing and packaging are not repeated on this Linux host.
The builds use `publish: never`; no release artifact was uploaded.
