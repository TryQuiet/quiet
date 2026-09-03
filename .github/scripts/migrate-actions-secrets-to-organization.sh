#!/usr/bin/env bash

set -euo pipefail

organization="${MIGRATION_ORGANIZATION:?MIGRATION_ORGANIZATION is required}"
repositories="${MIGRATION_REPOSITORIES:?MIGRATION_REPOSITORIES is required}"
: "${GH_TOKEN:?ORG_SECRETS_MIGRATION_TOKEN must be available through GH_TOKEN}"

if [[ ! "$organization" =~ ^[A-Za-z0-9][A-Za-z0-9-]*$ ]]; then
  echo "::error::Invalid organization name: $organization" >&2
  exit 1
fi

if [[ ! "$repositories" =~ ^[A-Za-z0-9_.-]+(,[A-Za-z0-9_.-]+)*$ ]]; then
  echo "::error::Repositories must be comma-separated names without owners or spaces" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "::error::The GitHub CLI is required" >&2
  exit 1
fi

# Each entry is ORGANIZATION_SECRET_NAME:SOURCE_ENVIRONMENT_VARIABLE. The
# existing GH_TOKEN uses a different environment variable so it cannot replace
# the short-lived credential used by the GitHub CLI.
secret_mappings=(
  ANDROID_FIREBASE_KEY:ANDROID_FIREBASE_KEY
  APPLE_ID:APPLE_ID
  APPLE_ID_PASS:APPLE_ID_PASS
  APPLE_TEAM_ID:APPLE_TEAM_ID
  APPSTORE_PASSWORD:APPSTORE_PASSWORD
  APPSTORE_USER:APPSTORE_USER
  APP_STORE_CONNECT_API_KEY_ISSUER_ID:APP_STORE_CONNECT_API_KEY_ISSUER_ID
  APP_STORE_CONNECT_API_KEY_KEY:APP_STORE_CONNECT_API_KEY_KEY
  APP_STORE_CONNECT_API_KEY_KEY_ID:APP_STORE_CONNECT_API_KEY_KEY_ID
  QUIET_AWS_ACCESS_KEY_ID:MIGRATION_SOURCE_AWS_ACCESS_KEY_ID
  QUIET_AWS_SECRET_ACCESS_KEY:MIGRATION_SOURCE_AWS_SECRET_ACCESS_KEY
  CHROMATIC_PROJECT_TOKEN:CHROMATIC_PROJECT_TOKEN
  GH_TOKEN:MIGRATION_SOURCE_GH_TOKEN
  GOOGLE_KEYSTORE:GOOGLE_KEYSTORE
  GOOGLE_KEYSTORE_ALIAS:GOOGLE_KEYSTORE_ALIAS
  GOOGLE_KEYSTORE_PASSWORD:GOOGLE_KEYSTORE_PASSWORD
  IOS_CERTIFICATE_KEY:IOS_CERTIFICATE_KEY
  IOS_FIREBASE_KEY:IOS_FIREBASE_KEY
  IOS_NSE_PROFILE_KEY:IOS_NSE_PROFILE_KEY
  IOS_PROFILE_KEY:IOS_PROFILE_KEY
  MAC_CSC_KEY_PASSWORD:MAC_CSC_KEY_PASSWORD
  MAC_CSC_LINK:MAC_CSC_LINK
  MATCH_GIT_BASIC_AUTHORIZATION:MATCH_GIT_BASIC_AUTHORIZATION
  MATCH_KEYCHAIN_PASSWORD:MATCH_KEYCHAIN_PASSWORD
  MATCH_PASSWORD:MATCH_PASSWORD
  SERVICE_ACCOUNT_JSON:SERVICE_ACCOUNT_JSON
  WIN_ALIAS:WIN_ALIAS
  WIN_CSC_KEY_PASSWORD:WIN_CSC_KEY_PASSWORD
  WIN_CSC_LINK:WIN_CSC_LINK
)

missing_secrets=()
for mapping in "${secret_mappings[@]}"; do
  environment_name="${mapping#*:}"
  if [[ -z "${!environment_name-}" ]]; then
    missing_secrets+=("${mapping%%:*}")
  fi
done

if (( ${#missing_secrets[@]} > 0 )); then
  printf '::error::Source secrets are missing or empty: %s\n' "${missing_secrets[*]}" >&2
  exit 1
fi

for mapping in "${secret_mappings[@]}"; do
  secret_name="${mapping%%:*}"
  environment_name="${mapping#*:}"

  echo "Migrating $secret_name"
  printf '%s' "${!environment_name}" |
    gh secret set "$secret_name" \
      --org "$organization" \
      --repos "$repositories" \
      --app actions
done

echo "Migrated ${#secret_mappings[@]} secrets to $organization for: $repositories"
