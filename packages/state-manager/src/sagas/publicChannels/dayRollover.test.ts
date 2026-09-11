import { setupCrypto } from '@quiet/identity'
import { type Store } from '../store.types'
import { StoreKeys } from '../store.keys'
import { prepareStore } from '../../utils/tests/prepareStore'
import { currentChannelMessagesMergedBySender } from './publicChannels.selectors'
import { publicChannelsActions, PublicChannelsState } from './publicChannels.slice'
import { publicChannelsAdapter, channelMessagesAdapter } from './publicChannels.adapter'
import { usersActions } from '../users/users.slice'
import { DateTime } from 'luxon'
import { type PublicChannelStorage } from '@quiet/types'

/**
 * Regression coverage for https://github.com/TryQuiet/quiet/issues/2751 (and its
 * duplicate #1661): the 'Today' / 'Yesterday' message-date marker never rolled over
 * on its own - it stayed frozen at whatever formatMessageDisplayDate() first computed,
 * until a new message arrived and changed dailyGroupedCurrentChannelMessages' input.
 *
 * formatMessageDisplayDate() itself was never wrong (see formatMessageDisplayDate.test.ts) -
 * the bug was that nothing ever asked it again once the local calendar day changed.
 *
 * NOTE on setup: this test seeds the channel directly via prepareStore's preloaded state
 * (using the same publicChannelsAdapter/channelMessagesAdapter the real reducer uses)
 * rather than dispatching publicChannelsActions.addChannel, and doesn't use the shared
 * getReduxStoreFactory/factory-girl test helper. Both addChannel's reducer and that
 * helper reference ChannelOperationStatus.SUCCESS/.FAILED from @quiet/types, and the
 * symlinked @quiet/types build available in this environment predates that enum
 * (confirmed pre-existing: the same crash happens on the untouched
 * publicChannels.selectors.test.ts, unrelated to this fix). Preloading state sidesteps
 * that environment issue entirely.
 */
describe('day rollover (#2751 / #1661): message-date marker updates without a new message', () => {
  const channelId = 'general'
  const userId = 'userId_alice'

  let store: Store

  beforeAll(() => {
    setupCrypto()
    process.env.LC_ALL = 'en_US.UTF-8'
  })

  beforeEach(() => {
    // Fake timers so we can move the wall clock across local midnight below without
    // waiting 24 real hours - this is the "fake timers" evidence for the fix.
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-09-11T23:00:00'))

    const messages = channelMessagesAdapter.addOne(channelMessagesAdapter.getInitialState(), {
      id: 'msg-sent-at-2300',
      type: 1, // MessageType.Basic
      message: 'hello, future me',
      createdAt: DateTime.now().toSeconds(),
      channelId,
      userId,
    } as any)

    const channels = publicChannelsAdapter.addOne(publicChannelsAdapter.getInitialState(), {
      id: channelId,
      name: 'general',
      description: 'Welcome to #general',
      owner: userId,
      timestamp: DateTime.now().toSeconds(),
      public: true,
      messages,
    } as unknown as PublicChannelStorage)

    store = prepareStore({
      [StoreKeys.PublicChannels]: {
        ...new PublicChannelsState(),
        channels,
        currentChannelId: channelId,
      },
    }).store

    store.dispatch(
      usersActions.setUserProfile({
        userId,
        nickname: 'alice',
        bio: '',
      } as any)
    )
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('labels the message "Today" right after it is sent', () => {
    const groups = currentChannelMessagesMergedBySender(store.getState())
    expect(Object.keys(groups)).toEqual(['Today'])
  })

  it('keeps showing "Today" once real time has crossed into tomorrow, until something bumps dayTick (documents the root cause)', () => {
    // Prime reselect's memoized cache the same way the UI would have, back when it was
    // still "Today" - this is the call the real app makes on every render.
    expect(Object.keys(currentChannelMessagesMergedBySender(store.getState()))).toEqual(['Today'])

    jest.setSystemTime(new Date('2026-09-12T00:05:00'))

    // No new message, no dispatch of any kind - just calling the selector again with a
    // later wall clock. reselect still returns its memoized answer from setup time.
    const groups = currentChannelMessagesMergedBySender(store.getState())
    expect(Object.keys(groups)).toEqual(['Today'])
  })

  it('relabels the message "Yesterday" once dayTickSaga bumps dayTick after local midnight, with no new message', () => {
    // Prime reselect's memoized cache at 'Today', same as the previous test - proving
    // the fix actually invalidates a real stale cache, not just a first-ever computation.
    expect(Object.keys(currentChannelMessagesMergedBySender(store.getState()))).toEqual(['Today'])

    jest.setSystemTime(new Date('2026-09-12T00:05:00'))

    // This is exactly what dayTickSaga (./dayTick/dayTick.saga.ts) dispatches once its
    // delay() past local midnight fires - see dayTick.saga.test.ts for that half.
    store.dispatch(publicChannelsActions.tickCurrentDay())

    const groups = currentChannelMessagesMergedBySender(store.getState())
    expect(Object.keys(groups)).toEqual(['Yesterday'])
  })
})
