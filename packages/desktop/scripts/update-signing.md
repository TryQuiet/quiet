# Desktop update signing

Windows installers and Linux AppImages are verified by the app with its own release key, not with a
certificate authority, so an expired or unrenewed code-signing certificate cannot break updates. macOS
is verified by Squirrel.Mac against the app's Developer ID signature.

- `src/main/update-signing-keys.json` holds the Ed25519 **public** keys compiled into the app
  (`src/main/updaterSecurity.ts`). The app accepts a download only if `<file>.sig` next to it carries a
  valid signature, from any listed key, over `version`, file name and the file's sha512.
- `scripts/updateSigning.cjs` is run by electron-builder (`afterAllArtifactBuild`) in the release jobs.
  It signs each `.exe` and `.AppImage` with the private key from the `QUIET_UPDATE_SIGNING_KEY`
  secret (PEM, or base64 of the PEM) and publishes the `.sig` files with the release.
- `scripts/beforePack.cjs` stops a build that electron-builder will publish, before anything is packaged or
  uploaded, when the key is missing or does not match a public key in `src/main/update-signing-keys.json`.
  "Will publish" is decided as electron-builder's PublishManager does (`--publish`, implicit CI/tag/`release`
  script publishing, pull-request rule; `before-pack.test.cjs` compares the two), and event labels such as
  `IS_LOCAL` or `IS_E2E` do not excuse a missing key. `updateSigning.cjs` also refuses a key that does not match
  the shipped keys, and verifies every signature it wrote against them, before electron-builder uploads.
- Run **Actions > Check update signing key** (or `QUIET_UPDATE_SIGNING_KEY=... node scripts/checkUpdateSigningKey.cjs`)
  to prove the secret matches the pinned key without building or publishing anything.
- The app re-hashes the downloaded file against the verified hash, synchronously, immediately before it is
  handed to the installer (both `quitAndInstall` and install-on-quit), and refuses and deletes a file that
  changed. A same-user process that wins the race between that check and the installer starting is outside
  what this can stop.

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
- Quiet's packaged `app-update.yml` has no `publisherName`, so electron-updater's own Windows Authenticode
  check (and the CVE-2024-39698 fix in it) is not active. The Windows installers are signed with a
  certificate that has expired, so pinning a publisher now would make Windows updates fail closed. Once a
  valid certificate is in use, set `win.signtoolOptions.publisherName`; `updaterSecurity.test.ts` shows the
  release-key check and that check together.

## Local update loop

`scripts/updateLoopCheck.cjs` serves a feed (its own throwaway signing key) from one process and runs the
real `AppImageUpdater` / `NsisUpdater` with the app's hardening against it from another:
`node scripts/updateLoopCheck.cjs serve <port> <key-file>`, then
`node scripts/updateLoopCheck.cjs check http://<host>:<port> <key-file> [linux|win32]`
(needs `npm run build:main`). `npm run test:updater-loop` runs both on localhost.
