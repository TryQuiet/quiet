# Consider operating TUF for desktop updates

Status: **proposal for consideration; deployment is not approved or complete**.

This records the remaining operational work for the authenticated updater in
[PR #3485](https://github.com/TryQuiet/quiet/pull/3485). The implementation,
provisioning template, root-import helper and command-by-command
[setup guide](tuf-setup.md) are already prepared. No production TUF repository,
AWS signing key or approved bootstrap root has been provisioned by this work.

The desktop upgrade stack is #3422 → #3482 → #3484 → #3485. This proposal is
stacked on #3485 and changes documentation only. It does not authorize cloud
spending, create keys, change GitHub settings, publish updates or weaken the
updater's verification checks.

## Decision to make

Consider adopting the official TUF-on-CI service for both Linux and Windows
release metadata. Its signatures bind the platform, architecture, channel and
installer digest independently of the artifact bucket. Windows continues to use
the existing CSC certificate for Authenticode signing.

The prepared deployment uses one public metadata repository for stable and
alpha, human-controlled hardware keys for root/release authorization, and one
dedicated AWS KMS key for automatic snapshot/timestamp renewal. GitHub uses
OIDC to access that online key; the setup needs public role/region variables,
not another private-key secret in Actions. The two platform roles are `linux`
and `win32`; the signed target paths distinguish channels.

The benefit comes with operating work: selecting and retaining signers, human
release approval, paying for KMS, keeping metadata fresh between releases,
handling expiry alerts and rehearsing key rotation. The template schedules the
online job four times daily, but root and release-role renewal still requires
human signatures. These responsibilities need named owners before adoption.

**Release consequence:** #3485 currently fails production Linux/Windows builds
when trusted roots or repository URLs are missing. Deferring this proposal
therefore means deferring that PR's production rollout too. If the team chooses
a different update-authentication design, revise and review #3485 explicitly;
do not bypass its gate or silently fall back to unauthenticated metadata. The
earlier Electron and builder PRs can be evaluated separately.

## Decisions and prerequisites

| Decision | Prepared starting point | Still needed |
| --- | --- | --- |
| Service owner | Quiet release maintainers | Name the primary operator and backup; assign expiry/incident coverage |
| Metadata hosting | Public `TryQuiet/quiet-update-metadata` from the official template, GitHub Pages | Approve repository name, access controls and publication origin |
| AWS location and cost | One retained P-256 KMS key and a narrowly scoped online role | Choose account/region, approve cost and identify a deployment operator |
| Root custody | PIV-capable hardware keys; preferably two signatures from three independent signers | Confirm devices, signers, threshold and recovery arrangements |
| Release authorization | Hardware signers for targets and delegated Linux/Windows roles | Choose release signers and review thresholds; keep online KMS separate |
| Channel separation | Shared repository/root, distinct signed stable/alpha paths | Accept this boundary or choose separate repositories before provisioning |
| Release readiness | Existing Windows CSC credentials and the prepared public publisher subject | Validate the current certificate subject and real signed release artifacts |

The implementation session could not create the new signing repository with its
available GitHub credential, and had no authenticated AWS session. These are
access prerequisites, not completed setup. Hardware signer availability has
not been established. Do not use test keys or an arbitrary downloaded root.

## Work to schedule if adopted

### Repository and online signer

- [ ] Create the metadata repository from the reviewed official TUF-on-CI
  template; confirm its pinned workflow/action versions.
- [ ] Configure Pages, the `publish` deployment branch, required bot permissions
  and review/access rules compatible with scheduled metadata commits.
- [ ] Choose the AWS account/region and deploy
  [the CloudFormation template](../build/tuf-online-signing.cfn.json), reusing an
  existing GitHub OIDC provider where appropriate.
- [ ] Bind the online role to the exact repository's main-branch OIDC subject and
  audience. Configure `AWS_ROLE_TO_ASSUME` and `AWS_REGION` as repository
  variables; do not copy artifact-upload credentials or root/release keys into
  that role or repository.
- [ ] Confirm live OIDC/KMS authorization from the stock online-sign workflow;
  preserve the key on deletion/replacement and restrict key administration.

### Initial trust and release roles

- [ ] Provision the approved signers' unused hardware slots. Check the exact
  slot before generation, require physical touch for every signature and verify
  the generated key's policies afterward, following [the setup guide](tuf-setup.md).
- [ ] Run the initial signing event; explicitly choose AWS KMS for the online
  signer and hardware keys for human signers. Review public key IDs, thresholds
  and expiry, and collect the required signatures before merging.
- [ ] Create and approve delegated `linux` and `win32` roles before importing
  manifests under `targets/linux/x64/` and `targets/win32/x64/`.
- [ ] Independently review the public bootstrap root and fingerprint. Import it
  into both configured channels with
  [the checked importer](../scripts/configureUpdateTrust.cjs), set the actual
  HTTPS metadata/target origins, and review and commit the generated public
  trust files on the implementation branch. No private keys belong in the app.

### Rehearsal before a production rollout

- [ ] Configure the `desktop-update-publishing` environment and its operators.
- [ ] Build an immutable prerelease candidate, verify the real Windows
  certificate/publisher and final AppImage/installer hashes, and publish the
  installer/blockmap before authorizing its channel manifest.
- [ ] Sign the exact staged YAML bytes through the platform role, confirm TUF
  publication, then pass the authenticated publication gate for legacy YAML.
  Keep one candidate artifact ID throughout; do not rebuild between phases.
- [ ] Exercise discovery, download, cached download and installation on native
  Linux and Windows with the deployed service. Confirm that bad signatures,
  tampering, expired metadata and rollback fail without installing an update
  or closing the running app.
- [ ] Exercise the transition from an older client. Retain legacy manifests and
  artifacts during migration; older clients gain TUF protection only after
  installing the transition release.
- [ ] Record live evidence and resolve remaining production signing/notarization
  checks in the release plan. Local Linux tests do not establish native macOS
  notarization or use of Quiet's actual Windows certificate.

### Ongoing operation and recovery

- [ ] Assign alerts for failed renewal/publication and approaching expiry to an
  operator and backup. Confirm renewal during a period with no app releases.
- [ ] Set a schedule for human root, targets and platform-role renewal.
- [ ] Rehearse sequential root rotation with the required old/new signatures and
  an offline client's return through numbered root history.
- [ ] Preserve numbered roots and define custody/recovery procedures for lost
  hardware keys, a compromised online key and a changed Windows publisher.
- [ ] Document who can authorize emergency changes and how release operators
  verify the intended candidate independently of the artifact uploader.

## Evidence already available and acceptance criteria

The implementation has real P-256 root validation tests, updater HTTP/download
and cache/install tests, rotation/rollback/expiry checks, and a CloudFormation
lint check. Local verification after adding provisioning passed 46 updater tests
with the native Windows test skipped on Linux. An earlier
[dedicated Linux and Windows run](https://github.com/TryQuiet/quiet/actions/runs/34627120752)
passed real temporary-certificate Authenticode and installer execution checks.
Daybreak reviewed the provisioning code and the corrected hardware-key procedure.

Those results validate the prepared implementation, not a deployed service.
Adoption is ready for a production rollout only after the ownership decisions,
reviewed trust, live online renewal, native signed prerelease rehearsal and
recovery evidence above are complete. Record the responsible owners and evidence
links here when those tasks are scheduled and completed.

For commands, use [first-time setup](tuf-setup.md). For the publication order and
client migration, use [desktop update signing](update-signing.md). This proposal
tracks the adoption decision and remaining work without duplicating those runbooks.
