/* eslint import/first: 0 */
import Immutable from 'immutable'

import create from '../create'
import { initialState, actions } from './notifications'
import notificationsSelectors from '../selectors/notifications'

describe('notifications reducer handles', () => {
  let store = null
  beforeEach(async () => {
    store = create({
      initialState: Immutable.Map({
        notifications: initialState
      })
    })
    jest.clearAllMocks()
  })

  describe('action', () => {
    it('enqueueSnackbar', () => {
      store.dispatch(actions.enqueueSnackbar({
        message: 'This is a sample message',
        options: {
          persistent: true
        }
      }))

      const notifications = notificationsSelectors.data(store.getState())

      expect.assertions(notifications.size * 2)

      // Test if generates ids and remove them for snapshot
      const withoutKeys = notifications.map(
        n => {
          expect(typeof n.get('key')).toEqual('number')
          return n.delete('key')
        }
      )
      expect(withoutKeys).toMatchSnapshot()
    })

    it('removeSnackbar', () => {
      const { payload } = store.dispatch(actions.enqueueSnackbar({
        message: 'This is a sample message',
        options: {
          persistent: true
        }
      }))

      store.dispatch(actions.removeSnackbar(payload.key))

      const notifications = notificationsSelectors.data(store.getState())
      expect(notifications).toMatchSnapshot()
    })
  })
})
