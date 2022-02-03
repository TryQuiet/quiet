/* eslint import/first: 0 */

import notificationCenterSelectors from './notificationCenter'
import { initialState as NotificationsCenter } from '../handlers/notificationCenter'

import create from '../create'

describe('NotificationsCenter', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      notificationCenter: {
        ...NotificationsCenter,
        channels: { key1: 1, key2: 2 },
        user: { key1: 1, key2: 2, filterType: 1, sound: 1 },
        contacts: { key1: 1, key2: 2, muted1: 4, muted2: 4 }
      }

    })
  })

  it('channels selector', async () => {
    expect(
      notificationCenterSelectors.channels(store.getState())
    ).toMatchSnapshot()
  })
  it('channel by id selector', async () => {
    expect(
      notificationCenterSelectors.channelFilterById('key1')(store.getState())
    ).toMatchSnapshot()
  })
  it('contacts selector', async () => {
    expect(
      notificationCenterSelectors.contacts(store.getState())
    ).toMatchSnapshot()
  })
  it('blockedUsers selector', async () => {
    expect(
      notificationCenterSelectors.blockedUsers(store.getState())
    ).toMatchSnapshot()
  })
  it('contact by address selector', async () => {
    expect(
      notificationCenterSelectors.contactFilterByAddress('key1')(
        store.getState()
      )
    ).toMatchSnapshot()
  })
  it('user selector', async () => {
    expect(notificationCenterSelectors.user(store.getState())).toMatchSnapshot()
  })
  it('user filterType selector', async () => {
    expect(
      notificationCenterSelectors.userFilterType(store.getState())
    ).toMatchSnapshot()
  })
  it('user sound selector', async () => {
    expect(
      notificationCenterSelectors.userSound(store.getState())
    ).toMatchSnapshot()
  })
})
