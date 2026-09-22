# Native macOS drag regression

Build and package the production desktop renderer, then launch the packaged
binary using an empty disposable profile, for example:

```sh
DATA_DIR=Quiet-native-drag-test ./dist/mac-arm64/Quiet.app/Contents/MacOS/Quiet --remote-debugging-port=9231
```

On an unlocked Mac desktop with Accessibility permission for the invoking
terminal/Python, run from `packages/desktop` with Node 24 and Python 3:

```sh
npm run test:macos-native-drag
```

`PYTHON` can select a Python executable; `QUIET_DEBUG_PORT` can change the port.
The app must display the initial Join community form. This test does not create a
community or bypass captcha. It switches to Create community, submits an empty
form to exercise Continue validation, and returns to Join community.

Mouse input uses CoreGraphics `CGEventPost` through WindowServer. CDP is used
only to locate controls, observe application state, and focus/restore the window;
DOM clicks and Electron/Chromium synthetic input would bypass the native drag
hit testing that caused #3640. The title-bar movement assertion is a positive
control for event delivery, preventing false passes on locked/inaccessible Macs.
The test also verifies that content dragging leaves the window stationary and
that native clicks reach both onboarding controls.

Before the fix, the drag style on the 25px wrapper is inherited by `#root` and
its full-window descendants. Their native drag rectangles intercept the portal
onboarding controls even though those controls themselves have no drag style.
Keeping the drag strip as a sibling prevents that inherited full-window region.

The test requires a real macOS GUI session; headless Linux and DOM unit tests do
not provide evidence for this regression.

Validated on the source-built Electron 44.3.0 arm64 macOS package:

- Before the HTML change: title-bar positive control passed; content dragging
  changed window bounds from `(456, 184)` to `(516, 214)` and failed the test.
- After rebuilding and packaging with the HTML change: title-bar drag, stationary
  content, native Create community navigation, native Continue validation, and
  return to Join community all passed.
