# Desktop update signing

Windows installers and Linux AppImages are verified by the app with its own release key, not with a
certificate authority, so an expired or unrenewed code-signing certificate cannot break updates. macOS
is verified by Squirrel.Mac against the app's Developer ID signature.

- `src/main/update-signing-keys.json` holds the Ed25519 **public** keys compiled into the app
  (`src/main/updaterSecurity.ts`). The app accepts a download only if `<file>.sig` next to it carries a
  valid signature, from any listed key, over `version`, file name and the file's sha512.
- **Signing.** Whenever `QUIET_UPDATE_SIGNING_KEY` (PEM, or base64 of the PEM) is set, every Windows or Linux
  build signs with it, published or not, and a key that does not match `src/main/update-signing-keys.json` stops
  the build. `scripts/signArtifact.cjs` (electron-builder's `artifactBuildCompleted`, which runs before
  electron-builder starts uploading that artifact) signs each `.exe` / `.AppImage` and verifies the signature
  against the shipped keys, so a bad key stops the build before any object is written.
  `scripts/updateSigning.cjs` (`afterAllArtifactBuild`) then returns the `.sig` files for upload and fails if
  one is missing or stale.
- **Requiring a signature.** The release jobs in `.github/workflows/desktop-build.yml`, the only builds that
  publish, set `QUIET_REQUIRE_UPDATE_SIGNING=1`. With it, `scripts/beforePack.cjs` stops the build before anything
  is packaged or uploaded unless the key is present and accepted, and `scripts/verifyUpdateSignatures.cjs` checks
  every `.sig` after the build. Any other non-empty value of the variable is an error. Without it and without a key
  (local, pull-request and e2e builds, CLI or JS API) nothing is signed and nothing else is needed; such a build
  would be refused by the app if it were ever published, so a forgotten flag fails closed for users.
  `updater-security.test.cjs` checks that every publishing Windows/Linux step in that workflow sets it.
- Run **Actions > Check update signing key** (or `QUIET_UPDATE_SIGNING_KEY=... node scripts/checkUpdateSigningKey.cjs`)
  to prove the secret matches the pinned key without building or publishing anything.
- **Before the download.** The app fetches `<file>.sig` and checks it against the version, file name and
  sha512 that the feed announces before it downloads the installer, so a missing or wrong signature costs a
  4 KB request, not a full download on every check. electron-updater's own sha512 check (and a re-hash of the
  finished file, which also covers differential downloads) then ties the downloaded bytes to that signed hash.
- At install time (both `quitAndInstall` and install-on-quit) the app copies the verified file into a fresh
  private directory under its own cache (`<cache>/quiet-verified-installers/v-XXXXXX`, created exclusively,
  mode 0700), re-hashes the copy, re-checks its signature and runs the installer from that copy; the user-cache
  path it was downloaded to is never installed. Any mismatch is refused and the file deleted. Copies left by
  earlier launches are removed after a day, matching only those exact names (never following symlinks), and
  cleanup failures never replace the refusal.
- **No elevation.** Quiet's NSIS install is per user and never needs administrator rights, so the app refuses
  an update whose feed asks for them (`isAdminRightsRequired`) and refuses the `elevate.exe` fallback (and `electron.shell.openPath`, which upstream reaches on ENOENT and which can raise a UAC prompt: every failure to start the installer is a final error) that
  electron-updater takes when starting the installer directly fails. Elevating would hand a file path across
  an elevation boundary, where a same-user process could swap the bytes after they were checked.

  Residual risk: apart from elevation, a process running as the same user could still replace the copy between
  the check and the installer starting. It can already modify the installed app, so this is outside what the
  update check defends.

## Creating or rotating the key

```sh
node packages/desktop/scripts/generateUpdateSigningKey.cjs /secure/location/update-signing.pem
```

It prints the public key and never the private one. Put the private key in the
`QUIET_UPDATE_SIGNING_KEY` repository secret, keep an offline copy, and add the public key to
`src/main/update-signing-keys.json`.

To rotate, ship the new key before the old one is retired:

1. Release an app whose `update-signing-keys.json` lists **both** keys, signed with the **old** key.
   It has to go out on every maintained channel (stable and alpha): a stable install never takes a
   pre-release, so a bridge shipped only on alpha leaves stable users unprepared.
2. Wait until that release is the version nearly everyone runs. Decide the cutoff in advance (for
   example the oldest version still supported); installs that never update in that window cannot
   follow a switch and must reinstall by hand, because one signature file serves only one key. Keep
   recovery installers available.
3. Then sign with the **new** key and, in a later release, drop the old public key.

If the private key is lost before a hardened release is out, only pre-hardening clients (<= 11.3.0,
which ignore signatures) can still be bridged by a normal update. After hardened clients exist, a lost
or compromised key cannot be fixed by an update signed with it: those users need a new installer, so
keep the dual-key bridge in every release you can and store the key offline as well. A compromise of
both the key and the feed credentials is not repairable by rotation alone.

## Checking a release

After the first release (use an alpha), confirm that `<bucket>/<installer>.sig` exists next to the
installer and that an older install updates to it. A missing or wrong `.sig` makes the app refuse the
update and log `not signed by the Quiet release key`.

The private key must not be reachable with the S3 write credentials: if one compromise yields both,
the signature adds nothing over the feed's own sha512.

## Known limits

- The signature does not expire. A feed controller can replay any genuinely signed older stable release
  that is newer than the installed version. Releases carry no revocation; rotate the key if a signed build
  must never be installed again.
- Alpha and stable builds share the key. A stable install refuses pre-release updates, so a signed alpha
  cannot be pushed onto it.
- The `.sig` is streamed and the request is aborted at 4096 bytes (or an oversized `Content-Length`), so a
  hostile feed cannot make the app buffer it.
- The Windows installers are no longer Authenticode-signed (since #3716; the certificate expired in 2023), and
  the packaged `app-update.yml` has no `publisherName`, so electron-updater's own Windows signature check is
  not active. The release-key signature is the only check of an installer's origin.

## Local update loop

`scripts/updateLoopCheck.cjs` serves a feed (its own throwaway signing key) from one process and runs the
real `AppImageUpdater` / `NsisUpdater` with the app's hardening against it from another:
`node scripts/updateLoopCheck.cjs serve <port> <key-file>`, then
`node scripts/updateLoopCheck.cjs check http://<host>:<port> <key-file> [linux|win32]`
(needs `npm run build:main`). `npm run test:updater-loop` runs both on localhost.
