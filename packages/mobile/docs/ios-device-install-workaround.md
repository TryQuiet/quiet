<!--
  Documentation: iOS Device-Install Workaround
  Why `npm run ios` (which uses ios-deploy under the hood) hangs at
  "Installing and launching your app on iPhone" on iOS 17/18 paired
  devices, and the manual `xcrun devicectl` recipe to bypass it.
-->

# iOS Device-Install Workaround (`npm run ios` hangs at "Installing")

## Symptom

After `npm run ios` finishes the Xcode build, the React Native CLI prints:

```
info Installing and launching your app on iPhone
```

…and hangs there indefinitely. The phone never shows a "Trust this developer" prompt and the app never appears or relaunches. The `ios-deploy` process is alive but at 0% CPU.

## Why

`@react-native-community/cli` shells out to `ios-deploy` to push the built `.app` over USB. `ios-deploy` (1.12.x and earlier) talks to the legacy `MobileDevice.framework` install path that Apple removed for paired devices on iOS 17+. The newer transport is Apple's `CoreDevice` stack, exposed via `xcrun devicectl`. RN 0.77's CLI does not yet use `devicectl`, so on iOS 17/18 phones the install just stalls.

## Workaround

Build with the RN CLI (or `xcodebuild` directly), then install + launch with `devicectl`. The build artifact is the same — only the transport changes.

1. Find your device's UDID:

   ```bash
   xcrun devicectl list devices
   ```

   Look for the row whose **State** is `available (paired)` and copy the **Identifier** (e.g. `5BD488FF-AD5C-5B43-BA3A-C61D1B5EE433`).

2. Build the app for the device. Either let `npm run ios` run until it hangs at "Installing and launching your app on iPhone" (the `.app` is already built at that point — `Ctrl+C` is fine), or invoke `xcodebuild` directly:

   ```bash
   cd packages/mobile/ios
   xcodebuild \
     -workspace Quiet.xcworkspace \
     -configuration Debug \
     -scheme Quiet \
     -destination "id=<UDID>" \
     build
   ```

3. Locate the built `.app`. Default location:

   ```
   ~/Library/Developer/Xcode/DerivedData/Quiet-*/Build/Products/Debug-iphoneos/Quiet.app
   ```

4. Install it via `devicectl`:

   ```bash
   xcrun devicectl device install app \
     --device <UDID> \
     ~/Library/Developer/Xcode/DerivedData/Quiet-*/Build/Products/Debug-iphoneos/Quiet.app
   ```

5. Launch it via `devicectl`:

   ```bash
   xcrun devicectl device process launch \
     --device <UDID> \
     com.quietmobile
   ```

The bundle identifier is `com.quietmobile` for the standard debug build.

## Notes

- This doesn't replace `ios-deploy` for everyone — Macs running older OS / Xcode and developers on iOS 16 or below should be unaffected and can keep using `npm run ios` end-to-end.
- Metro still needs to be running (`npm run start`) for the Debug build's JS bundle. If Metro can't be reached from the device, shake the iPhone twice → Configure Bundler and point it at your Mac's LAN IP (`ipconfig getifaddr en0`).
- A first install on a new device still requires the usual one-time "Trust this developer" step in Settings → General → VPN & Device Management — that's an iOS prompt, unrelated to the install transport.
