#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
script="$script_dir/migrate-actions-secrets-to-organization.sh"
workflow="$script_dir/../workflows/migrate-actions-secrets-to-organization.yml"
test_dir="$(mktemp -d)"
trap 'rm -rf "$test_dir"' EXIT

mkdir -p "$test_dir/bin" "$test_dir/uploads"

cat >"$test_dir/bin/gh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

[[ "$1" == secret && "$2" == set ]]
secret_name="$3"
shift 3
printf '%s %s\n' "$secret_name" "$*" >>"$MIGRATION_TEST_CALLS"
cp /dev/stdin "$MIGRATION_TEST_UPLOADS/$secret_name"
EOF
chmod +x "$test_dir/bin/gh"

secret_names=(
  ANDROID_FIREBASE_KEY
  APPLE_ID
  APPLE_ID_PASS
  APPLE_TEAM_ID
  APPSTORE_PASSWORD
  APPSTORE_USER
  APP_STORE_CONNECT_API_KEY_ISSUER_ID
  APP_STORE_CONNECT_API_KEY_KEY
  APP_STORE_CONNECT_API_KEY_KEY_ID
  CHROMATIC_PROJECT_TOKEN
  GOOGLE_KEYSTORE
  GOOGLE_KEYSTORE_ALIAS
  GOOGLE_KEYSTORE_PASSWORD
  IOS_CERTIFICATE_KEY
  IOS_FIREBASE_KEY
  IOS_NSE_PROFILE_KEY
  IOS_PROFILE_KEY
  MAC_CSC_KEY_PASSWORD
  MAC_CSC_LINK
  MATCH_GIT_BASIC_AUTHORIZATION
  MATCH_KEYCHAIN_PASSWORD
  MATCH_PASSWORD
  SERVICE_ACCOUNT_JSON
  WIN_ALIAS
  WIN_CSC_KEY_PASSWORD
  WIN_CSC_LINK
)

for secret_name in "${secret_names[@]}"; do
  export "$secret_name=value-for-$secret_name"
done

export SERVICE_ACCOUNT_JSON=$'{"type":"service_account"}\nsecond-line\n'
export GH_TOKEN=short-lived-upload-token
export MIGRATION_SOURCE_GH_TOKEN=existing-source-token
export MIGRATION_SOURCE_AWS_ACCESS_KEY_ID=quiet-aws-access-key
export MIGRATION_SOURCE_AWS_SECRET_ACCESS_KEY=quiet-aws-secret-key
export MIGRATION_ORGANIZATION=TryQuiet
export MIGRATION_REPOSITORIES=quiet,quiet-private
export MIGRATION_TEST_CALLS="$test_dir/calls"
export MIGRATION_TEST_UPLOADS="$test_dir/uploads"
export PATH="$test_dir/bin:$PATH"

"$script"

[[ "$(wc -l <"$MIGRATION_TEST_CALLS")" -eq 29 ]]
grep -Fxq 'APPLE_ID --org TryQuiet --repos quiet,quiet-private --app actions' "$MIGRATION_TEST_CALLS"
grep -Fxq 'GH_TOKEN --org TryQuiet --repos quiet,quiet-private --app actions' "$MIGRATION_TEST_CALLS"
grep -Fxq 'QUIET_AWS_ACCESS_KEY_ID --org TryQuiet --repos quiet,quiet-private --app actions' "$MIGRATION_TEST_CALLS"
grep -Fxq 'QUIET_AWS_SECRET_ACCESS_KEY --org TryQuiet --repos quiet,quiet-private --app actions' "$MIGRATION_TEST_CALLS"
[[ "$(<"$MIGRATION_TEST_UPLOADS/APPLE_ID")" == value-for-APPLE_ID ]]
[[ "$(<"$MIGRATION_TEST_UPLOADS/GH_TOKEN")" == existing-source-token ]]
[[ "$(<"$MIGRATION_TEST_UPLOADS/QUIET_AWS_ACCESS_KEY_ID")" == quiet-aws-access-key ]]
[[ "$(<"$MIGRATION_TEST_UPLOADS/QUIET_AWS_SECRET_ACCESS_KEY")" == quiet-aws-secret-key ]]
[[ ! -e "$MIGRATION_TEST_UPLOADS/ORG_SECRETS_MIGRATION_TOKEN" ]]
printf '{"type":"service_account"}\nsecond-line\n' >"$test_dir/expected-service-account"
cmp "$test_dir/expected-service-account" "$MIGRATION_TEST_UPLOADS/SERVICE_ACCOUNT_JSON"

printf '%s\n' "${secret_names[@]}" AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY GH_TOKEN |
  sort >"$test_dir/expected-source-secrets"
sed -nE 's/^      [A-Z0-9_]+: \$\{\{ secrets\.([A-Z0-9_]+) \}\}$/\1/p' "$workflow" |
  sort >"$test_dir/workflow-source-secrets"
cmp "$test_dir/expected-source-secrets" "$test_dir/workflow-source-secrets"
grep -Fq 'GH_TOKEN: ${{ secrets.ORG_SECRETS_MIGRATION_TOKEN }}' "$workflow"
grep -Fxq '      MIGRATION_ORGANIZATION: TryQuiet' "$workflow"
grep -Fxq '      MIGRATION_REPOSITORIES: quiet,quiet-private' "$workflow"
if grep -Eq 'inputs\.(organization|repositories)' "$workflow"; then
  echo 'Workflow target scope must not be configurable at run time' >&2
  exit 1
fi

rm -f "$MIGRATION_TEST_CALLS"
rm -rf "$MIGRATION_TEST_UPLOADS"
mkdir -p "$MIGRATION_TEST_UPLOADS"
unset APPLE_ID

if "$script" >"$test_dir/missing-secret.stdout" 2>"$test_dir/missing-secret.stderr"; then
  echo 'Expected migration to fail when a source secret is missing' >&2
  exit 1
fi

grep -Fq 'Source secrets are missing or empty: APPLE_ID' "$test_dir/missing-secret.stderr"
[[ ! -e "$MIGRATION_TEST_CALLS" ]]
[[ -z "$(find "$MIGRATION_TEST_UPLOADS" -type f -print -quit)" ]]

echo 'Secret migration tests passed'
