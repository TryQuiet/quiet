/* eslint import/first: 0 */
import notificationsSelectors from './notifications'

import create from '../create'

describe('Imported channel', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: {
        notifications: [
          {
            message: 'Test message',
            key: 'test-key',
            options: {
              persist: true
            }
          }
        ]
      }
    })
  })

  it('data selector', async () => {
    expect(notificationsSelectors.data(store.getState())).toMatchSnapshot()
  })
})
