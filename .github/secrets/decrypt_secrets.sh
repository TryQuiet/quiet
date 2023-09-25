#!/bin/sh

set -e

gpg --quiet --batch --yes --decrypt --passphrase="$IOS_PROFILE_KEY2" --output ./.github/secrets/match_AppStore_comquietmobile.mobileprovision ./.github/secrets/match_AppStore_comquietmobile.mobileprovision.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$IOS_CERTIFICATE_KEY" --output ./.github/secrets/Certificates.p12 ./.github/secrets/Certificates.p12.gpg

mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles

cp ./.github/secrets/match_AppStore_comquietmobile.mobileprovision ~/Library/MobileDevice/Provisioning\ Profiles/718ac015-309f-49b6-9653-f6cf84a6377c.mobileprovision


security create-keychain -p "" build.keychain
security import ./.github/secrets/Certificates.p12 -t agg -k ~/Library/Keychains/build.keychain -P "$IOS_CERTIFICATE_KEY" -A

security list-keychains -s ~/Library/Keychains/build.keychain
security default-keychain -s ~/Library/Keychains/build.keychain
security unlock-keychain -p "" ~/Library/Keychains/build.keychain
security set-keychain-settings ~/Library/Keychains/build.keychain #this removes autolock

security set-key-partition-list -S apple-tool:,apple: -s -k "" ~/Library/Keychains/build.keychain
