/**
 * Shared tap-feedback tuning for touchable rows that live inside a scrollable
 * list. See https://github.com/TryQuiet/quiet/issues/1495.
 *
 * The value is passed as `delayPressIn` to `TouchableOpacity`. React Native's
 * default is 0, which means `Pressability` emits its `DELAY` signal
 * synchronously from `onResponderGrant`: the row moves straight to
 * `RESPONDER_ACTIVE_PRESS_IN` and dims on touch-down, before the gesture is
 * known to be a tap. Dragging or flicking the list therefore dims whichever row
 * the finger landed on, which is the non-standard behaviour reported on #1495.
 *
 * With a non-zero delay the `DELAY` signal is scheduled on a timer instead. If
 * the enclosing FlatList/ScrollView claims the touch first, the row receives
 * `RESPONDER_TERMINATED` while still in `RESPONDER_INACTIVE_PRESS_IN`, which is
 * not an active state, so `onPressIn` is never called and no opacity change is
 * ever shown. A tap that ends before the delay elapses still flashes, because
 * `Pressability` special-cases `RESPONDER_RELEASE` from an inactive press-in
 * state and fires activate + deactivate back to back.
 *
 * 150 ms is the value the issue reporter asked for in
 * https://github.com/TryQuiet/quiet/issues/1495#issuecomment-1625261531.
 *
 * Deliberately paired with no `delayPressOut`, so the highlight lasts only as
 * long as the tap (the issue's second requirement). `TouchableOpacity` sets
 * `minPressDuration: 0`, so nothing holds the dim open after release.
 */
export const TAP_FEEDBACK_DELAY_MS = 150
