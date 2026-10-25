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
- `scripts/beforePack.cjs` stops a release build, before anything is uploaded, when the key is missing or
  does not match a public key in `src/main/update-signing-keys.json`.

## Creating or rotating the key

```sh
node packages/desktop/scripts/generateUpdateSigningKey.cjs /secure/location/update-signing.pem
```

It prints the public key and never the private one. Put the private key in the
`QUIET_UPDATE_SIGNING_KEY` repository secret, keep an offline copy, and add the public key to
`src/main/update-signing-keys.json`.

To rotate: add the new public key next to the old one and release, signed with the old key. Once that
release is widely installed, sign with the new key and drop the old public key. A key lost before a
rotation release means every user has to reinstall by hand.

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
- The `.sig` is read into memory by electron-updater's HTTP executor before its 4 KB limit is applied.
