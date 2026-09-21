# Physical iPhone and desktop tryout

Date: 2026-09-16. Application source: `bc447315648e565879a8e83d8acfd4814a99c1f9`
on `experiment/ios-native-libsodium`. No application code changed for this run.

## Installed phone build

- Installed Quiet 10.0.0 (613) on the connected iPhone 16e running iOS 18.5.
- Built the `Quiet` scheme in Release for ARM64 iPhoneOS with Xcode 26.3.
  JavaScript is bundled in the app; Metro is unnecessary.
- Development signing and strict recursive signature verification passed. Both
  application and notification-extension provisioning profiles include the phone.
- Updated the existing `com.quietmobile` installation after privately backing up
  its Documents and Library directories. No uninstall or data reset was used.
- The app launched and remained running. Captured startup logs contained zero
  native-crypto fallback warnings. The user confirmed that the app appeared to work.
- The unsigned device libsodium executable is byte-identical to the previously
  tested artifact. The installed backend bundle matches the post-audit E2E bundle.

The local build uses `.env.production`, but Tor-only communities can be used
without a server. The user selected Tor for the manual phone/desktop testing.
Firebase configuration was unavailable in this checkout, so push notifications
are unavailable in this build.

SSH signing failed with `errSecInternalComponent` even after the login keychain
was unlocked. Running the same signing/build command through a temporary
LaunchAgent in the logged-in desktop session succeeded. The temporary signing,
build, and observation jobs were removed afterward.

## Matching Linux desktop

- Built and packaged the Linux x64 desktop from the same source revision.
- Packaged `QSS_ALLOWED=false`, `QPS_ALLOWED=false`, and an empty QSS endpoint.
- Verified that the packaged backend SHA-256 matches the installed phone's
  backend exactly: `d9d3b205bd410219dba35872057eb629d563df6261a76f5b057d14d5dab9b6fa`.
- Launched with a separate `Quiet-ios-libsodium-tor` data directory. Confirmed
  backend startup and visually checked the rendered community-join screen.
- Added a local **Quiet iPhone Tor Test** launcher for repeatable quit/reopen
  testing. The running window is titled **Quiet — iPhone Tor Test**.

Existing Linux dependency caches were copied into this worktree. Shared compiled
packages and the backend bundle were copied from the same Mac worktree used for
the phone build; the desktop main process and renderer were compiled on Linux.
The unpacked desktop preview logs a missing updater configuration, so this
preview does not provide automatic updates.

## Scope of validation

This records installation, packaging, startup, and readiness for manual Tor
testing. It does **not** establish physical-device multiplayer, restart
persistence, background delivery, or phone performance results. Those manual
messaging and lifecycle checks were handed to the user with both apps available.

LLDB attempts did not obtain a completed attachment/module list. Native library
mapping on the physical phone therefore remains unconfirmed independently of
the packaged artifact and absence of fallback warnings. Earlier simulator native
loading and all 33 simulator/desktop E2E passes remain separate evidence.

Sanitized hashes and checks are in
[physical-phone-and-desktop.json](physical-phone-and-desktop.json). Private app
data, device identifiers, raw logs, and screenshots are excluded.
