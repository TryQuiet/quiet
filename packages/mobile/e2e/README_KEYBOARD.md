# Android keyboard layout matrix

Start an Appium session against a dedicated Android emulator and join a fixture community with a `general` channel. The runner uses that existing session and chat; it does not create sessions, reset profiles, or send messages. Keep the fixture free of attachment previews, and do not interact with it while the matrix runs.

```sh
python3 packages/mobile/e2e/run-keyboard-size-matrix.py \
  --server http://127.0.0.1:4725 \
  --session-id SESSION_ID \
  --serial emulator-5590 \
  --adb "$ANDROID_HOME/platform-tools/adb" \
  --output /tmp/quiet-keyboard-matrix
```

The runner verifies the serial belongs to both the existing session and an emulator. It covers 720×1280 at 320dpi, 1080×2400 at 420dpi, and 1600×2560 at 320dpi. The dedicated emulator app restarts after each display change without resetting its data. Fixture text uses native key events because Appium bulk setValue does not reliably grow the React Native input. Each size checks single-line and three-line text through two keyboard show/hide cycles. Geometry must settle before capture: the composer/toolbar meets the keyboard or safe-area boundary, the send control retains a 44dp target and 8dp clearance, and multiline text grows the field. Original display overrides, composer text, and keyboard visibility are restored in `finally`.

The output contains 24 successful layout records, screenshots, and native UI trees, or failure artifacts at the first incorrect layout. These artifacts can contain fixture chat text. No message/draft text is printed in the geometry report.

Test parsing, the physically observed failure cases, and restoration on failure without a device:

```sh
python3 -m unittest discover -s packages/mobile/e2e -p test_keyboard_size_matrix.py -v
```
