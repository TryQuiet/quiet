import { delay, put } from 'typed-redux-saga'
import { publicChannelsActions } from '../publicChannels.slice'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('dayTickSaga')

// One extra second of buffer past midnight so we never fire a hair early due to
// sub-millisecond scheduling jitter.
const POST_MIDNIGHT_BUFFER_MS = 1000

/**
 * Milliseconds from `now` until just after the next local midnight.
 *
 * Deliberately recomputed from the wall clock on every call (including every
 * loop iteration of dayTickSaga below) instead of assuming a fixed 24h period.
 * That makes it self-correcting across:
 *  - DST transitions, where the next midnight can be 23h or 25h away - the
 *    field-based `Date` constructor below asks the JS engine for "tomorrow at
 *    00:00:01 local time" directly, rather than adding 86400000ms;
 *  - the process being suspended (e.g. laptop sleep) across one or more
 *    midnights - whenever it wakes and this is next called, `now` reflects
 *    the real current time, so it schedules against the *next* midnight from
 *    wherever the clock actually is, rather than drifting or firing a stored
 *    stale target repeatedly.
 */
export const msUntilNextLocalMidnight = (now: Date = new Date()): number => {
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
  return nextMidnight.getTime() - now.getTime() + POST_MIDNIGHT_BUFFER_MS
}

/**
 * Bumps publicChannels.dayTick shortly after every local midnight. That value
 * isn't consumed for its content - it exists purely to bust the memoization on
 * dailyGroupedCurrentChannelMessages (publicChannels.selectors.ts) so 'Today' /
 * 'Yesterday' message-date labels update on their own, instead of staying
 * frozen until a new message is sent or received.
 *
 * See https://github.com/TryQuiet/quiet/issues/2751 and #1661.
 *
 * Uses a self-rearming delay() (one wake per day) rather than a setInterval or
 * per-minute poll, so it costs nothing while the channel view is otherwise
 * idle. It is safe to run indefinitely: like the existing uptimeSaga
 * (appConnection/uptime/uptime.saga.ts), it is `fork`-ed from a master saga and
 * is cancelled along with it (see publicChannels.master.saga.ts), so there is
 * no timer to manually clean up.
 */
export function* dayTickSaga(): Generator {
  while (true) {
    const waitMs = msUntilNextLocalMidnight()
    yield* delay(waitMs)
    logger.info('local day changed, bumping dayTick')
    yield* put(publicChannelsActions.tickCurrentDay())
  }
}
