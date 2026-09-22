import { publicChannelsSlice, publicChannelsActions, PublicChannelsState } from '../publicChannels.slice'

/**
 * Regression coverage for a redux-persist interaction in the #2751 fix.
 *
 * `publicChannels` IS persisted (see packages/desktop/src/renderer/store/reducers.ts,
 * whitelist: [... StateManagerStoreKeys.PublicChannels ...]), and the rehydrate path runs
 * PublicChannelsTransform's outbound handler -> sanitizePublicChannelsPersistenceState(),
 * which returns `{ ...outboundState, <a few overrides> }`. It spreads the PERSISTED object
 * and never calls `new PublicChannelsState()`, so the class-field default `dayTick = 0`
 * does NOT apply to rehydrated state.
 *
 * For anyone upgrading from a build that predates `dayTick`, the rehydrated slice therefore
 * has no `dayTick` key at all. An unguarded `state.dayTick += 1` then yields NaN, and NaN + 1
 * stays NaN forever. Because reselect's default equality is `===` and `NaN === NaN` is false,
 * `dailyGroupedCurrentChannelMessages` would cache-miss on EVERY call from then on —
 * a permanent re-render cost in the message list (already flagged slow in #1116 / #648).
 *
 * These cases deliberately do NOT build state via `new PublicChannelsState()`: that
 * constructor supplies the default and is precisely the path that cannot reproduce this.
 */
describe('#2751 dayTick: redux-persist rehydration', () => {
  // Shaped like a pre-upgrade persisted slice: a present object, missing the new key.
  const rehydratedWithoutDayTick = () => {
    const { dayTick: _dropped, ...withoutDayTick } = new PublicChannelsState()
    return withoutDayTick as unknown as PublicChannelsState
  }

  it('state rehydrated from a pre-upgrade build genuinely lacks dayTick', () => {
    expect('dayTick' in rehydratedWithoutDayTick()).toBe(false)
  })

  it('produces a finite number, not NaN, on the first tick after rehydration', () => {
    const next = publicChannelsSlice.reducer(rehydratedWithoutDayTick(), publicChannelsActions.tickCurrentDay())
    expect(Number.isFinite(next.dayTick)).toBe(true)
  })

  it('keeps incrementing on subsequent days, so the selector cache-buster keeps changing', () => {
    const first = publicChannelsSlice.reducer(rehydratedWithoutDayTick(), publicChannelsActions.tickCurrentDay())
    const second = publicChannelsSlice.reducer(first, publicChannelsActions.tickCurrentDay())
    expect(Number.isFinite(second.dayTick)).toBe(true)
    expect(second.dayTick).not.toEqual(first.dayTick)
  })

  it('recovers even if an already-poisoned NaN was persisted by an intermediate build', () => {
    const poisoned = { ...new PublicChannelsState(), dayTick: NaN } as PublicChannelsState
    const next = publicChannelsSlice.reducer(poisoned, publicChannelsActions.tickCurrentDay())
    expect(Number.isFinite(next.dayTick)).toBe(true)
  })
})
