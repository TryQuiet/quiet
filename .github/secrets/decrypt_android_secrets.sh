#!/bin/sh

# Decrypt the Android Firebase config (google-services.json) and place it where the
# Gradle build expects it: packages/mobile/android/app/. The file is gitignored and
# stored encrypted as google-services.json.gpg.
#
# Safe to run on Linux CI runners: unlike decrypt_secrets.sh this does no macOS/iOS
# tooling. decrypt_secrets.sh calls this so the iOS and Android jobs stay in sync.
#
# Must be run from the repository root.

set -e

if [ -z "$ANDROID_FIREBASE_KEY" ]; then
  echo "ANDROID_FIREBASE_KEY is not set; skipping google-services.json decryption."
  echo "Firebase push notifications will be unavailable; release builds fail by design."
  exit 0
fi

gpg --quiet --batch --yes --decrypt --passphrase="$ANDROID_FIREBASE_KEY" \
  --output ./.github/secrets/google-services.json \
  ./.github/secrets/google-services.json.gpg

cp ./.github/secrets/google-services.json ./packages/mobile/android/app/google-services.json

echo "Decrypted google-services.json into packages/mobile/android/app/"
