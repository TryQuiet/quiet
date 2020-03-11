/* eslint import/first: 0 */
import Immutable from 'immutable'

import create from '../create'
import { initialState, actions } from './notificationCenter'
import notificationCenterSelector from '../selectors/notificationCenter'
import { notificationFilterType } from '../../../shared/static'

describe('notifications reducer handles', () => {
  let store = null
  beforeEach(async () => {
    store = create({
      initialState: Immutable.Map({
        notificationCenter: initialState
      })
    })
    jest.clearAllMocks()
  })

  describe('action', () => {
    it('set channel filter', () => {
      const channelId = 'testid'
      const notificationsBefore = notificationCenterSelector.channelFilterById(
        channelId
      )(store.getState())
      expect(notificationsBefore).toEqual(notificationFilterType.ALL_MESSAGES)
      store.dispatch(
        actions.setChannelNotificationFilter({
          channelId: channelId,
          filterType: notificationFilterType.MENTIONS
        })
      )

      const notificationsAfter = notificationCenterSelector.channelFilterById(
        channelId
      )(store.getState())
      expect(notificationsAfter).toEqual(notificationFilterType.MENTIONS)
    })
    it('set contact filter', () => {
      const contactAddress = 'address'
      const notificationsBefore = notificationCenterSelector.contactFilterByAddress(
        contactAddress
      )(store.getState())
      expect(notificationsBefore).toEqual(notificationFilterType.ALL_MESSAGES)
      store.dispatch(
        actions.setContactNotificationFilter({
          contact: contactAddress,
          filterType: notificationFilterType.MENTIONS
        })
      )
      const notificationsAfter = notificationCenterSelector.contactFilterByAddress(
        contactAddress
      )(store.getState())
      expect(notificationsAfter).toEqual(notificationFilterType.MENTIONS)
    })
    it('set user filter', () => {
      const notificationsBefore = notificationCenterSelector.userFilterType(store.getState())
      expect(notificationsBefore).toEqual(notificationFilterType.ALL_MESSAGES)
      store.dispatch(
        actions.setUserNotificationFilter({
          filterType: notificationFilterType.MENTIONS
        })
      )
      const notificationsAfter = notificationCenterSelector.userFilterType(store.getState())
      expect(notificationsAfter).toEqual(notificationFilterType.MENTIONS)
    })
  })
})
