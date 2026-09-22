# Physical iOS Tor listener regression

This separate app compiles the production `TorHandler`, `TorBackgroundTransitions`
and `Extensions` against the same installed Tor framework as Quiet. It preserves
an installed Quiet app and account. It generates only disposable test identities.

Requirements: macOS, Xcode, Ruby `xcodeproj`, a trusted physical iPhone, and a
valid development signing identity/profile. A simulator does not reproduce iOS
reclaiming TCP listeners during suspension.

```sh
export QUIET_TOR_TEST_TEAM=YOUR_TEAM
ruby packages/mobile/scripts/tor-device-regression/create-project.rb \
  "$PWD" /tmp/quiet-tor-device-build \
  "$PWD/packages/mobile/ios/Pods/Tor/Build/iOS/Tor.framework"
xcodebuild -project /tmp/quiet-tor-device-build/TorDeviceRegression.xcodeproj \
  -scheme TorDeviceRegression -destination 'generic/platform=iOS' \
  -derivedDataPath /tmp/quiet-tor-device-build/DerivedData \
  -allowProvisioningUpdates build
xcrun devicectl device install app --device DEVICE_ID \
  /tmp/quiet-tor-device-build/DerivedData/Build/Products/Debug-iphoneos/TorDeviceRegression.app
python3 packages/mobile/scripts/tor-device-regression/run.py \
  --device DEVICE_ID --cycles 10 --output /tmp/quiet-tor-device-results
```

For manual signing, replace `-allowProvisioningUpdates` with
`CODE_SIGN_STYLE=Manual PROVISIONING_PROFILE_SPECIFIER=PROFILE_UUID
CODE_SIGN_IDENTITY='Apple Development'`. `QUIET_TOR_TEST_BUNDLE` overrides the
separate test app's bundle identifier if your profile requires it.

The driver launches Settings to background the app, waits for its UIKit
background task to complete, verifies the three listeners are closed, leaves it backgrounded for eight seconds, and
returns. Each readiness callback must support authenticated TCP control,
`ADD_ONION NEW:ED25519-V3`, a SOCKS handshake and connection to the HTTP tunnel.
The test also checks that the process, Tor thread, authentication cookie and
previously detached onion survive every cycle. No bootstrap or descriptor
publication is required for local identity generation. Status output contains no
private onion keys or control cookies. This covers the native lifecycle and the
local operation needed for account creation; it is not a full React Native UI or
onion-network reachability test.

Add `--rapid-transitions` to first exercise twenty immediate background/foreground
reversals, checking that all acknowledgement callbacks complete exactly once and
the final foreground intent restores usable control and onion generation.

For an additional real network check, install `appium-ios-device` in a separate
Mac tooling directory, set `QUIET_IOS_DEVICE_LIBRARY` to that module's absolute
path, and add `--network-probe --usb-udid DEVICE_UDID`. This makes an HTTPS request
through the phone's HTTP tunnel to `https://check.torproject.org/api/ip` after cold
start and every resume, requiring `IsTor=true`. It needs working Internet/Tor and
is deliberately separate from local key-generation readiness. The exit address
is never logged. `--background-seconds 30` exercises longer suspension intervals.

Use a new output directory for every run. To compare a baseline, compile the same
host against the previous production handler and run the same device driver.
Keep other device tests idle during the run; the driver controls the foreground
application. Leave the iPhone unlocked.
