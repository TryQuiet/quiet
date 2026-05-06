#!/bin/sh

set -e

gpg --quiet --batch --yes --decrypt --passphrase="$IOS_PROFILE_KEY" --output ./.github/secrets/match_AppStore_comquietmobile.mobileprovision ./.github/secrets/match_AppStore_comquietmobile.mobileprovision.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$IOS_NSE_PROFILE_KEY" --output ./.github/secrets/match_AppStore_comquietmobile_QuietNotificationServiceExtension.mobileprovision ./.github/secrets/match_AppStore_comquietmobile_QuietNotificationServiceExtension.mobileprovision.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$IOS_CERTIFICATE_KEY" --output ./.github/secrets/Certificates.p12 ./.github/secrets/Certificates.p12.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$IOS_FIREBASE_KEY" --output ./.github/secrets/GoogleService-Info.plist ./.github/secrets/GoogleService-Info.plist.gpg

mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles

cp ./.github/secrets/match_AppStore_comquietmobile.mobileprovision ~/Library/MobileDevice/Provisioning\ Profiles/762df280-302c-4336-a56d-c74914169337.mobileprovision
cp ./.github/secrets/match_AppStore_comquietmobile_QuietNotificationServiceExtension.mobileprovision ~/Library/MobileDevice/Provisioning\ Profiles/247b3945-4f28-4ef1-b722-e98fb3fb59f7.mobileprovision
cp ./.github/secrets/GoogleService-Info.plist ./packages/mobile/ios/GoogleService-Info.plist

security create-keychain -p "" build.keychain
security import ./.github/secrets/Certificates.p12 -t agg -k ~/Library/Keychains/build.keychain -P "$IOS_CERTIFICATE_KEY" -A

security list-keychains -s ~/Library/Keychains/build.keychain
security default-keychain -s ~/Library/Keychains/build.keychain
security unlock-keychain -p "" ~/Library/Keychains/build.keychain
security set-keychain-settings ~/Library/Keychains/build.keychain #this removes autolock

security set-key-partition-list -S apple-tool:,apple: -s -k "" ~/Library/Keychains/build.keychain
