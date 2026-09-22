import { act, fireEvent } from '@testing-library/react-native'
import type { ReactTestInstance } from 'react-test-renderer'

import { TAP_FEEDBACK_DELAY_MS } from '../../const/tapFeedback'

/**
 * Driving a touchable's *feedback* rather than its action.
 *
 * `fireEvent.press` calls `onPress` straight out and never runs the press state
 * machine, so it cannot see a highlight appear, stay away or be cancelled.
 * Every touchable in the app — `Pressable` and the `Touchable*` family alike —
 * gets that state machine from `Pressability`, which is driven by the responder
 * events below. They are the same ones React Native's own gesture responder
 * sends, and the pair RNTL's `userEvent.press` dispatches.
 *
 * Pressability reads `persist` and `currentTarget.measure` off the event, so
 * the stub carries them.
 *
 * All of these advance timers, so the caller must be on fake timers.
 */
const touchEvent = (registrationName: string) => ({
  target: {},
  preventDefault: () => undefined,
  isDefaultPrevented: () => false,
  stopPropagation: () => undefined,
  isPropagationStopped: () => false,
  persist: () => undefined,
  isPersistent: () => false,
  timeStamp: 0,
  nativeEvent: {
    changedTouches: [],
    identifier: 0,
    locationX: 0,
    locationY: 0,
    pageX: 0,
    pageY: 0,
    target: 0,
    timestamp: Date.now(),
    touches: [],
  },
  currentTarget: { measure: () => undefined },
  dispatchConfig: { registrationName },
})

const advance = (ms: number): void => {
  act(() => {
    jest.advanceTimersByTime(ms)
  })
}

/** The finger lands. Nothing else: no time passes, so a delayed highlight has not arrived yet. */
export const hold = (element: ReactTestInstance): void => {
  fireEvent(element, 'responderGrant', touchEvent('onResponderGrant'))
}

/** The finger lands and stays put long enough for a delayed highlight to show. */
export const holdSteadily = (element: ReactTestInstance): void => {
  hold(element)
  advance(TAP_FEEDBACK_DELAY_MS)
}

/**
 * The finger lifts. Pressability holds the pressed look for a minimum 130ms
 * after that, so the release only lands once the timers have run.
 */
export const release = (element: ReactTestInstance): void => {
  fireEvent(element, 'responderRelease', touchEvent('onResponderRelease'))
  advance(200)
}

/**
 * The list underneath takes the touch over, which is what a scroll view does as
 * soon as the finger moves — the start of every flick. Time then runs well past
 * the tap-feedback delay, so a highlight that was merely waiting would show.
 */
export const dragAway = (element: ReactTestInstance): void => {
  fireEvent(element, 'responderTerminate', touchEvent('onResponderTerminate'))
  advance(TAP_FEEDBACK_DELAY_MS * 2)
}

/** Time passing mid-gesture, for asserting on either side of the delay. */
export const holdFor = (ms: number): void => advance(ms)
