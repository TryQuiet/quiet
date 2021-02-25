/* eslint import/first: 0 */
import create from '../create'
import { actions } from './notifications'
import notificationsSelectors from '../selectors/notifications'

describe('notifications reducer handles', () => {
  let store = null
  beforeEach(async () => {
    store = create({
      notifications: []
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

      expect.assertions(notifications.length * 2)

      // Test if generates ids and remove them for snapshot
      const withoutKeys = notifications.map(
        n => {
          const temp = {
            ...n
          }
          delete temp.key
          expect(typeof n.key).toEqual('string')
          return {
            ...temp
          }
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
