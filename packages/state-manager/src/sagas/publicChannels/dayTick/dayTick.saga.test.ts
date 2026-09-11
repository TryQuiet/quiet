import { dayTickSaga, msUntilNextLocalMidnight } from './dayTick.saga'
import { publicChannelsActions } from '../publicChannels.slice'

describe('msUntilNextLocalMidnight', () => {
  it('waits until just after the next local midnight on an ordinary evening', () => {
    const now = new Date(2026, 8, 11, 22, 0, 0, 0) // Sept 11 2026, 22:00 local
    const waitMs = msUntilNextLocalMidnight(now)

    const nextMidnight = new Date(now.getTime() + waitMs)
    expect(nextMidnight.getHours()).toBe(0)
    expect(nextMidnight.getMinutes()).toBe(0)
    expect(nextMidnight.getDate()).toBe(now.getDate() + 1)
    // ~2h away, plus the small fixed post-midnight buffer.
    expect(waitMs).toBeGreaterThan(2 * 60 * 60 * 1000)
    expect(waitMs).toBeLessThan(2 * 60 * 60 * 1000 + 5000)
  })

  it('still returns a small positive wait right before midnight', () => {
    const now = new Date(2026, 8, 11, 23, 59, 59, 500) // Sept 11 2026, 23:59:59.5 local
    const waitMs = msUntilNextLocalMidnight(now)

    expect(waitMs).toBeGreaterThan(0)
    expect(waitMs).toBeLessThan(2000)
  })

  it('always targets the next midnight from wherever "now" actually is, so a process waking up days late self-corrects instead of drifting', () => {
    // Simulates dayTickSaga only getting a chance to re-check the clock several days
    // after it originally armed a delay() - e.g. the laptop was asleep for a while.
    const wokeUpLate = new Date(2026, 8, 15, 9, 0, 0, 0)
    const waitMs = msUntilNextLocalMidnight(wokeUpLate)

    // Still just "until tonight's midnight", never a stale multi-day-old target.
    expect(waitMs).toBeGreaterThan(0)
    expect(waitMs).toBeLessThan(24 * 60 * 60 * 1000)
  })

  // DST correctness (the local midnight to local midnight gap is 23h on a
  // spring-forward day and 25h on a fall-back day, because msUntilNextLocalMidnight
  // asks the JS engine for "tomorrow at 00:00:00 local" via the field-based Date
  // constructor - new Date(y, m, d + 1, 0, 0, 0) - rather than adding a fixed
  // 86400000ms) is NOT exercised as a jest test here: this project's jest scripts
  // hardcode TZ=UTC (see package.json "test"), and Node/V8 caches the process's
  // timezone the first time anything touches Date/Intl, so reassigning
  // process.env.TZ mid-test has no effect inside this harness (verified empirically -
  // it silently no-ops, it does not throw). Forcing a real zone would mean spawning a
  // whole separate process, which is disproportionate for one property that's
  // otherwise guaranteed by the platform. Verified instead with a standalone script:
  //
  //   TZ=America/New_York node -e "
  //     const a = new Date(2026,10,1,0,0,0,0); const b = new Date(2026,10,2,0,0,0,0);
  //     console.log((b - a) / 3600000)"           // => 25 (fall-back day)
  //   TZ=America/New_York node -e "
  //     const a = new Date(2026,2,8,0,0,0,0); const b = new Date(2026,2,9,0,0,0,0);
  //     console.log((b - a) / 3600000)"           // => 23 (spring-forward day)
})

describe('dayTickSaga', () => {
  // Step the real generator and inspect the plain redux-saga effect descriptors it
  // yields, rather than driving it through actual saga middleware: this is an infinite
  // while(true) loop, and typed-redux-saga's delay()/put() helpers only produce a
  // meaningful effect object when iterated by a real generator (calling them directly,
  // e.g. to build an "expected" value, just returns an inert, contentless Generator) -
  // so structural assertions on the real yields are the reliable way to test this.
  it('waits until next local midnight, dispatches tickCurrentDay, then loops forever', () => {
    const now = new Date(2026, 8, 11, 22, 0, 0, 0) // Sept 11 2026, 22:00 local
    jest.useFakeTimers()
    jest.setSystemTime(now)

    const gen = dayTickSaga()
    const expectedWaitMs = msUntilNextLocalMidnight(now)

    const firstDelay = gen.next().value as any
    expect(firstDelay.type).toBe('CALL')
    expect(firstDelay.payload.fn.name).toBe('delayP')
    expect(firstDelay.payload.args[0]).toBe(expectedWaitMs)

    const tick = gen.next().value as any
    expect(tick.type).toBe('PUT')
    expect(tick.payload.action).toEqual(publicChannelsActions.tickCurrentDay())

    // Loops back around and schedules the *following* midnight too - this saga is
    // meant to run for the lifetime of the app, not fire once. (The fake clock hasn't
    // moved, so the next target is computed the same way.)
    const secondDelay = gen.next().value as any
    expect(secondDelay.type).toBe('CALL')
    expect(secondDelay.payload.fn.name).toBe('delayP')
    expect(secondDelay.payload.args[0]).toBe(expectedWaitMs)

    jest.useRealTimers()
  })
})
