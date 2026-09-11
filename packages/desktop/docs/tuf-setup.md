# Set up Quiet's TUF signing service

This provisions the first production trust for the updater. It uses the official
TUF-on-CI v0.20.0 template, one public metadata repository for both channels,
hardware keys for release authorization, and one AWS KMS key for automatic
snapshot/timestamp renewal. The Windows CSC certificate remains separate.

There is **no TUF private-key secret to upload to GitHub** in this setup:

| Item | Where it lives | What goes in GitHub |
| --- | --- | --- |
| Root/release private keys | Signers' YubiKeys, PIV slot 9c | Public keys and signed metadata only |
| Automatic renewal private key | AWS KMS | Public role ARN and region as Actions **variables** |
| Bootstrap trust | Reviewed `metadata/root.json` | Public file committed to Quiet |

You need permission to create a TryQuiet repository and configure Actions/Pages,
an AWS session allowed to deploy IAM/KMS resources, and at least one PIV-capable
YubiKey (a FIDO-only Security Key will not work). Prefer three independent root
signers with a two-signature threshold. A one-signer initial setup is supported,
but losing that sole key prevents future authorized root changes.

## 1. Create the metadata repository

Run these commands in your Quiet checkout, with your `gh-org` alias available.
The repository is public because clients must fetch its public metadata.

```bash
QUIET_CHECKOUT="$(pwd)"
QUIET_TUF_REPO=TryQuiet/quiet-update-metadata
QUIET_TUF_CHECKOUT="$(dirname "$QUIET_CHECKOUT")/quiet-update-metadata"
gh-org repo create "$QUIET_TUF_REPO" --public \
  --template theupdateframework/tuf-on-ci-template \
  --description 'Signed desktop update metadata for Quiet, maintained with TUF-on-CI.'
gh-org repo clone "$QUIET_TUF_REPO" "$QUIET_TUF_CHECKOUT"
```

In the new repository settings:

1. Set **Pages → Source** to **GitHub Actions**.
2. Set the **github-pages** environment's allowed deployment branch to
   **publish**, replacing the initial **main** restriction.
3. Enable **Actions → General → Allow GitHub Actions to create and approve pull
   requests**. The official workflows use the automatically supplied
   `GITHUB_TOKEN`; no custom PAT secret is needed for the default setup.
4. Restrict repository write access to release maintainers and require review
   of workflow changes. Keep the template's online-signing schedule enabled.

The official template is currently commit
`88cc3dfa0f1e986723441e8083b854ba527dd88d`; its TUF actions are pinned to
`4e63a5934064216b7caa7a4a833b1b0936bec660` (v0.20.0). Review newer template
versions before using them. See the upstream
[repository setup](https://github.com/theupdateframework/tuf-on-ci/blob/v0.20.0/docs/REPOSITORY-MAINTENANCE.md).

## 2. Generate the automated key inside AWS

Authenticate with your existing AWS administrator/SSO profile and choose the
region. The commands below use `quiet-admin` and `us-east-1` as examples:

```bash
export AWS_PROFILE=quiet-admin
export AWS_REGION=us-east-1
aws sso login --profile "$AWS_PROFILE"
aws sts get-caller-identity
```

For this **new repository only**, explicitly select GitHub's default subject
format with immutable repository IDs. This avoids relying on an organization
customization or the older name-only format:

```bash
gh-org api --method PUT "repos/$QUIET_TUF_REPO/actions/oidc/customization/sub" \
  -H 'X-GitHub-Api-Version: 2026-03-10' \
  -F use_default=true -F use_immutable_subject=true
QUIET_TUF_SUBJECT="$(gh-org api "repos/$QUIET_TUF_REPO" \
  --jq '"repo:\(.owner.login)@\(.owner.id)/\(.name)@\(.id):ref:refs/heads/main"')"
printf '%s\n' "$QUIET_TUF_SUBJECT"
```

Reuse the account's GitHub OIDC provider if it already exists:

```bash
QUIET_TUF_PROVIDER_ARN="$(aws iam list-open-id-connect-providers \
  --query "OpenIDConnectProviderList[?ends_with(Arn, '/token.actions.githubusercontent.com')].Arn | [0]" \
  --output text)"
if [ "$QUIET_TUF_PROVIDER_ARN" = None ]; then QUIET_TUF_PROVIDER_ARN=''; fi
```

An existing provider must include `sts.amazonaws.com` in its `ClientIDList`;
check it with `aws iam get-open-id-connect-provider --open-id-connect-provider-arn
"$QUIET_TUF_PROVIDER_ARN"`. If none exists, the template creates it.

Deploy the checked-in template. AWS generates a non-exportable P-256 signing
key; the new GitHub role can only call `kms:Sign` and `kms:GetPublicKey` on that
key. Its trust policy permits only the exact signing repository's `main` branch,
with audience `sts.amazonaws.com`. PR branches and the Quiet build repository
receive no signing access. AWS charges for the KMS key and signing requests.

```bash
aws cloudformation deploy \
  --stack-name quiet-tuf-online \
  --template-file "$QUIET_CHECKOUT/packages/desktop/build/tuf-online-signing.cfn.json" \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides "GitHubOidcSubject=$QUIET_TUF_SUBJECT" \
    "ExistingGitHubOidcProviderArn=$QUIET_TUF_PROVIDER_ARN"
QUIET_TUF_ROLE_ARN="$(aws cloudformation describe-stacks --stack-name quiet-tuf-online \
  --query "Stacks[0].Outputs[?OutputKey=='AwsRoleToAssume'].OutputValue | [0]" --output text)"
QUIET_TUF_KEY_ARN="$(aws cloudformation describe-stacks --stack-name quiet-tuf-online \
  --query "Stacks[0].Outputs[?OutputKey=='OnlineKeyArn'].OutputValue | [0]" --output text)"
gh-org variable set AWS_ROLE_TO_ASSUME --repo "$QUIET_TUF_REPO" --body "$QUIET_TUF_ROLE_ARN"
gh-org variable set AWS_REGION --repo "$QUIET_TUF_REPO" --body "$AWS_REGION"
printf 'Online key ARN: %s\n' "$QUIET_TUF_KEY_ARN"
```

These two **variables** are the only AWS values uploaded to GitHub. Do not add
AWS access keys or the Windows PFX to this repository. The template retains the
key if the stack is deleted. Asymmetric keys cannot use AWS automatic rotation;
replace this key through a signed TUF root change before retiring the old key.
The upstream tool deliberately uses the same online key for snapshot and
timestamp; it must never also be a root or release authorization key.

## 3. Generate your root/release key on your YubiKey

Each signer runs this on their own trusted computer with their own YubiKey.
Install YubiKey Manager (`ykman`) and the Yubico PKCS#11 module (`ykcs11` on
Debian, `yubico-piv-tool` with Homebrew). Inspect the exact private-key slot:

```bash
ykman piv keys info 9c
```

The generation commands below are for an **unused 9c slot**. Stop if the slot
contains a key, or if your device cannot establish whether it is empty. Use a
separate device in that case. Do not reset PIV or overwrite an existing signing
key. General `ykman piv info` output alone does not establish that the private-key
slot is empty.

Change the factory PIN, PUK and management key using the interactive prompts;
store recovery information in your password manager, not the repository:

```bash
ykman piv access change-pin
ykman piv access change-puk
ykman piv access change-management-key --algorithm AES256 --protect
ykman piv keys generate --algorithm ECCP256 --touch-policy ALWAYS 9c quiet-tuf-public.pem
ykman piv certificates generate 9c --subject 'CN=YOUR_GITHUB_USERNAME' quiet-tuf-public.pem
ykman piv keys info 9c
```

Verify that the final slot information reports **generated on-chip**, **ECCP256**,
**Touch policy: ALWAYS**, and **PIN policy: ALWAYS** (the default for slot 9c).
Touch policy must be chosen during key generation; a key generated with the
default never-touch policy cannot be fixed afterward without replacing it.
The private key is generated inside the YubiKey. `quiet-tuf-public.pem` is
public; the tool uploads public TUF key records during initialization. There
is no PEM private key to copy, upload or derive from CSC. See the upstream
[YubiKey procedure](https://github.com/theupdateframework/tuf-on-ci/blob/v0.20.0/docs/YUBIKEY-PIV-SETUP.md)
and [PIN/touch policy documentation](https://docs.yubico.com/yesdk/users-manual/application-piv/pin-touch-policies.html).

Install `tuf-on-ci-sign==0.20.0` with pipx or in a Python virtual environment,
then create `$QUIET_TUF_CHECKOUT/.tuf-on-ci-sign.ini`:

```ini
[settings]
user-name = @YOUR_GITHUB_USERNAME
pull-remote = origin
push-remote = origin
```

This local configuration is ignored by the template. The initialization
operator also needs the AWS session from step 2 to read the online public key
(`kms:GetPublicKey`); other hardware signers do not need AWS access.

## 4. Initialize trust and both platform roles

```bash
cd "$QUIET_TUF_CHECKOUT"
tuf-on-ci-delegate sign/init
```

Choose the actual GitHub signers and thresholds for **root** and **targets**.
Choose **AWS KMS** for the online key, supply `$QUIET_TUF_KEY_ARN`, and choose
**ECDSA_SHA_256**. When choosing your personal signing method, select
**Yubikey**, not the experimental Sigstore default, which is not compatible
with this client setup. The CLI shows the proposed trust and asks you to sign
and push. Additional signers run `tuf-on-ci-sign sign/init` in their clones.
Review the public keys and thresholds before merging the completed signing PR.

Now create the roles required by Quiet's existing nested target paths, completing
and merging each signing event before starting the next:

```bash
tuf-on-ci-delegate sign/add-linux linux
# Choose the Linux release signers; complete signatures and merge this event.
tuf-on-ci-delegate sign/add-win32 win32
# Choose the Windows release signers; complete signatures and merge this event.
```

The top-level targets signers approve these delegations, and the invited role
signers add their keys/signatures through the prompted `tuf-on-ci-sign` event.
You may use the same human signers initially; keep these roles on hardware keys,
separate from the online KMS key. TUF-on-CI maps the first subdirectory to a role:
`targets/linux/x64/alpha.yml` belongs to `linux`, and
`targets/win32/x64/latest.yml` belongs to `win32`. Simply copying nested files
without creating their roles is insufficient. Both channels can share this
repository/root because the signed target path binds the channel.

After merging, confirm the online-sign and publish workflows succeed and Pages
serves `/metadata/timestamp.json`. Also manually dispatch `online-sign.yml` on
`main` and check success, proving the scheduled job's AWS identity works.
Watch the signing repository for renewal/failure issues. Root, targets and
platform metadata require human signing again before their configured expiry;
the KMS job only renews snapshot/timestamp automatically.

## 5. Install the reviewed public trust into Quiet

From a locally verified signing checkout, update `main` after the completed
ceremony. Review `metadata/root.json` with the participating signers and record
its SHA-256 fingerprint (`shasum -a 256 metadata/root.json`). Obtain this root
from that reviewed signing event, not an unverified download from Pages.

In the Quiet checkout, with desktop dependencies installed:

```bash
cd "$QUIET_CHECKOUT"
node packages/desktop/scripts/configureUpdateTrust.cjs \
  --root "$QUIET_TUF_CHECKOUT/metadata/root.json" \
  --sha256 'REPLACE_WITH_REVIEWED_64_HEX_SHA256' \
  --metadata-url 'https://tryquiet.github.io/quiet-update-metadata/metadata/' \
  --targets-url 'https://tryquiet.github.io/quiet-update-metadata/targets/'
```

Use the actual Pages URL shown by the repository if it differs. This helper
checks the fingerprint, root signatures, expiry, Windows publisher and HTTPS
URLs through the real production packaging gate before installing public roots
for `latest` and `alpha`. It keeps the current S3 installer locations and refuses
to replace already configured trust. Review the generated diff, run
`npm --prefix packages/desktop run test:updater`, then **commit the public
root/config files on the same PR branch before review**. No private keys belong
in that commit.

Finish the release environment configuration and two-phase prerelease rehearsal
in [update-signing.md](update-signing.md). Copy only the exact verified candidate
YAML into `targets/linux/x64/alpha.yml` or `targets/win32/x64/alpha.yml` on a
`sign/RELEASE_NAME` branch. Commit and push those files, sign the resulting
event with `tuf-on-ci-sign sign/RELEASE_NAME`, then review and merge the event.
TUF-on-CI publishes the versioned metadata and hash-prefixed target filenames;
the client handles those names using the configured `/targets/` URL.

## Validation and recovery boundaries

The root importer has realistic P-256 signature/expiry/fingerprint failure
tests. The CloudFormation template is validated by `cfn-lint==1.56.3` in CI.
Actual IAM/OIDC/KMS authorization, hardware signatures and Pages publication
still require the live setup and prerelease rehearsal above. These offline
checks cannot prove a cloud deployment succeeded.

For key renewal or compromise, follow the sequential root rotation procedure
in [update-signing.md](update-signing.md); do not rerun initial provisioning to
silently replace deployed trust. Hardware PINs, PUKs and management keys stay
with the signer. Restrict KMS key administration separately from the online role.

References: [AWS online signing](https://github.com/theupdateframework/tuf-on-ci/blob/v0.20.0/docs/ONLINE-SIGNING-SETUP.md),
[signer setup](https://github.com/theupdateframework/tuf-on-ci/blob/v0.20.0/docs/SIGNER-SETUP.md),
[GitHub OIDC with AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws),
[OIDC configuration API](https://docs.github.com/en/rest/actions/oidc#set-the-customization-template-for-an-oidc-subject-claim-for-a-repository).
