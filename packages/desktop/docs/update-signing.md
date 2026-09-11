# Desktop update signing

Windows uses electron-builder's standard SignTool integration with the existing
`WIN_CSC_LINK` and `WIN_CSC_KEY_PASSWORD` secrets. `WIN_ALIAS` and Jsign are no
longer needed. The approved full publisher subject in `build/update-trust.json`
matches the public certificate on Quiet 9.0.2. The final installer must validate
against that subject; a changed certificate identity requires an explicit trust
configuration update. Published prereleases have the same signing requirements
as stable releases. `TEST_MODE` does not skip signing.

Linux and Windows also authenticate their update channel manifest with
[`tuf-js`](https://github.com/theupdateframework/tuf-js). The client authenticates
the exact manifest bytes before electron-updater parses them, then the manifest's
SHA-512 and size bind the downloaded artifact. Windows additionally verifies
Authenticode. The install action refreshes TUF authorization and checks the final
cached file again. A failed check keeps Quiet running and does not install on quit.

## Required provisioning before a release

This change deliberately includes no production TUF key or bootstrap root.
`latest` and `alpha` repositories are unconfigured, so production Linux/Windows
builds fail until provisioning is complete. Preview builds still work, with their
automatic update path disabled by missing trust. Do not use test fixture keys.

1. Create a separate signing repository from the official
   [tuf-on-ci template](https://github.com/theupdateframework/tuf-on-ci-template).
   Follow its [repository maintenance manual](https://github.com/theupdateframework/tuf-on-ci/blob/main/docs/REPOSITORY-MAINTENANCE.md)
   and [signer setup](https://github.com/theupdateframework/tuf-on-ci/blob/main/docs/SIGNER-SETUP.md).
   Initialize it with `tuf-on-ci-delegate sign/init` after choosing the signers.
2. Use offline or hardware root keys, preferably a 2-of-3 threshold. Give release
   signing its own role/key and scope it to the release target paths below. Use
   the supported KMS configuration for online snapshot/timestamp maintenance;
   keep those signing permissions separate from S3 upload credentials. Do not
   import the Windows PFX as a TUF root or give the artifact uploader signing
   authority. TUF-on-ci manages the signing format, role versions and publication.
3. Obtain the initial public `root.json` directly from that reviewed signing
   ceremony. Review its key IDs, role thresholds and expiry independently of
   the artifact server, then commit it as
   `build/update-trust/latest/root.json` and, for a separate prerelease repository,
   `build/update-trust/alpha/root.json`.
4. Fill each repository entry in `build/update-trust.json` with three fixed HTTPS
   directory URLs, all ending with `/`: `metadataBaseUrl` for TUF metadata,
   `targetBaseUrl` for TUF targets, and `artifactBaseUrl` for existing installers.
   The current artifact directories are `https://s3.amazonaws.com/quiet.9.x/`
   and `https://s3.amazonaws.com/test.quiet/`. TUF-on-ci can host the small signed
   manifests on its own Pages origin. No new root is downloaded implicitly.
5. Configure the `desktop-update-publishing` Actions environment for the release
   operators. Exercise both publication phases with a prerelease and run the
   Windows verification workflow before shipping the transition release.

Existing CSC secrets suffice for Windows artifact signing. They do not configure
the independent TUF signing repository, its public bootstrap root, or the ongoing
timestamp service.

## Build, authorize, publish

The `Desktop Build` workflow builds with `-p never`, verifies the final artifact
and embedded trust, then retains an immutable Actions artifact containing the
installer, optional blockmap, exact legacy channel YAML, and `release.json`.
The Windows gate calls the same OS signature verifier as the running updater.
The existing GitHub release asset upload occurs only after this gate.

1. Record the build run ID and the **artifact ID** printed by `upload-artifact`.
   Keep that exact candidate throughout the signing event. Never rebuild it
   between signing and publication.
2. Run `Publish verified desktop update` for that candidate, with phase
   `artifacts`. This rechecks the staged artifact digest and Windows signature,
   verifies that the artifact belongs to a successful release-triggered Desktop
   Build run, and binds its commit/version to the published desktop release tag,
   then uploads only the installer/blockmap to the existing S3 bucket. It does
   not upload a channel YAML.
3. Copy the candidate's manifest, byte for byte, into the TUF signing repository
   at the target path recorded in `release.json`. Current release targets are
   `linux/x64/latest.yml`, `win32/x64/latest.yml` and the equivalent `alpha.yml`
   paths. The target's signed location binds platform, architecture and channel;
   the manifest must contain one full `.AppImage` or `.exe`, its SHA-512 and size.
   Approve that target through tuf-on-ci's normal signing event. Publish target
   files and versioned metadata before `timestamp.json`, the TUF commit point.
4. Run the same publication workflow with the same artifact ID and phase
   `channel`. It refreshes TUF, verifies its signatures/expiry/rollback state,
   requires the authenticated manifest to match the staged bytes exactly, and
   rechecks the artifact. Only then does it upload the legacy channel YAML.

New clients can discover the release after step 3. Old clients discover it after
step 4. Retain the legacy YAML and installers during migration. TUF protection
starts only once a client has installed this transition release; it cannot
retroactively authenticate updates in older clients.

## Maintenance and recovery

TUF-on-ci must refresh timestamp/snapshot metadata even between Quiet releases.
Monitor its signing and expiry alerts. Expired metadata, missing metadata, an
invalid system clock, or a verification error makes updating unavailable; the
client never falls back to unauthenticated metadata. A network outage does not
prevent using the existing app.

Rotate TUF roots through sequential versions signed by both the old and new
required thresholds. Keep every numbered `N.root.json` available so clients that
have been offline can traverse the chain. Rotate before expiration. Clients keep
rotated roots and metadata versions across restarts and do not reset trusted
state on error. A newly packaged bootstrap root does not discard newer cached
trust. Review emergency recovery separately if signing thresholds are lost.

For Windows publisher changes, first ship a release trusting both approved full
subjects, then change the signing certificate, and later remove the retired
subject. Renewing a certificate with the same exact subject retains OS chain
validation without changing the pin. Keep version downgrade disabled.

## Validation

`npm run test:updater` exercises real TUF metadata signatures and HTTP downloads,
pending cache reuse, root rotation/rollback, rejected updates and the actual
AppImage replacement/execution path with a harmless temporary installer.
On its disposable elevated Windows runner, the dedicated workflow generates
temporary code-signing certificates in the current user's personal store and
adds their public roots to the machine Root store (user Root imports need an
interactive confirmation). It builds/signs a harmless PE fixture and tests valid,
unsigned, wrong-signer, tampered and cached installer behavior, removing only its
tracked certificates from the explicit test stores. These fixtures are never used as production trust.

Platform signing/notarization still needs validation on its native runner. Local
Linux tests do not prove a production Windows certificate or macOS notarization
works. The local cache checks reject links and rehash immediately before install;
they are not intended to defend against an attacker already controlling the same
user account and racing local filesystem operations.
