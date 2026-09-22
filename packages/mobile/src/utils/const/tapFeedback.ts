/**
 * How long a finger has to stay put before a row shows that it has been tapped.
 *
 * A row inside a scrolling list is also the surface you drag to scroll it, and
 * a touchable claims the responder the moment it is touched. Without a delay
 * the row under your finger therefore lights up at the start of every flick and
 * stays lit until the list wins the responder back — feedback for a tap nobody
 * made. That is the first of the two follow-ups the maintainer left on #1495:
 *
 * > Opacity shouldn't change on drag/scroll since this is non-standard.
 *
 * 150ms is the number named in that comment. It is long enough for a drag to be
 * recognised first and short enough that a deliberate tap still reads as
 * immediate, and a press released inside the window is not swallowed: when the
 * delay never ran, `Pressability` activates and deactivates on release before
 * firing `onPress` (react-native `Pressability._performTransitionSideEffects`),
 * so a quick tap still flashes and still does its job.
 *
 * `Pressable` takes this as `unstable_pressDelay` and the `Touchable*`
 * components as `delayPressIn`; both end up as the same `Pressability` config.
 *
 * It belongs only on touchables that live inside something scrollable. A
 * control on a fixed surface — the community title bar, a dialog button — has
 * no drag to be confused with and should still respond on contact.
 */
export const TAP_FEEDBACK_DELAY_MS = 150
