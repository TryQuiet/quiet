import { type DeviceLinkInvite } from '@quiet/types'

import { prepareStore } from '../../../utils/tests/prepareStore'
import { connectionSelectors } from '../connection.selectors'
import { connectionActions } from '../connection.slice'
import { expireDeviceLinkSaga } from './expireDeviceLink.saga'

describe('expireDeviceLinkSaga', () => {
  const now = 1_700_000_000_000

  beforeEach(() => {
    jest.useFakeTimers('modern')
    jest.setSystemTime(now)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const createInvite = (expiresAt: number): DeviceLinkInvite => ({
    id: '5ah8uYodiwuwVybT' as DeviceLinkInvite['id'],
    seed: '5ah8uYodiwuwVybT',
    expiresAt,
    userId: '7JLX5PGtsFtGtqfY2co5U8Lq5hTA3',
    userName: 'Alice device owner',
  })

  it('keeps the invitation before expiry and clears it exactly at expiry', async () => {
    const { store, runSaga } = prepareStore()
    const invite = createInvite(now + 1_800_000)
    const action = connectionActions.setDeviceLinkInvite(invite)
    store.dispatch(action)

    const task = runSaga(expireDeviceLinkSaga, action)

    jest.advanceTimersByTime(1_799_999)
    expect(connectionSelectors.deviceLinkInvite(store.getState())).toEqual(invite)

    jest.advanceTimersByTime(1)
    await task.toPromise()
    expect(connectionSelectors.deviceLinkInvite(store.getState())).toBeUndefined()
  })

  it.each([0, -1])('clears an invitation expiring at or before the current time (%s ms)', async offset => {
    const { store, runSaga } = prepareStore()
    const invite = createInvite(now + offset)
    const action = connectionActions.setDeviceLinkInvite(invite)
    store.dispatch(action)

    const task = runSaga(expireDeviceLinkSaga, action)
    jest.runOnlyPendingTimers()
    await task.toPromise()

    expect(connectionSelectors.deviceLinkInvite(store.getState())).toBeUndefined()
  })

  it('does not clear a replacement invitation when an older timer expires', async () => {
    const { store, runSaga } = prepareStore()
    const expiringInvite = createInvite(now + 1_000)
    const replacementInvite = {
      ...createInvite(now + 2_000),
      id: '6bh9vZpejxvxWzcU' as DeviceLinkInvite['id'],
    }
    const action = connectionActions.setDeviceLinkInvite(expiringInvite)
    store.dispatch(action)

    const task = runSaga(expireDeviceLinkSaga, action)
    store.dispatch(connectionActions.setDeviceLinkInvite(replacementInvite))
    jest.advanceTimersByTime(1_000)
    await task.toPromise()

    expect(connectionSelectors.deviceLinkInvite(store.getState())).toEqual(replacementInvite)
  })
})
