/* eslint import/first: 0 */
import Immutable from 'immutable'

import notificationsSelectors from './notifications'

import create from '../create'

describe('Imported channel', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        // TODO: 07/05 change to Record
        notifications: Immutable.fromJS([
          {
            message: 'Test message',
            key: 'test-key',
            options: {
              persist: true
            }
          }
        ])
      })
    })
  })

  it('data selector', async () => {
    expect(notificationsSelectors.data(store.getState())).toMatchSnapshot()
  })
})
