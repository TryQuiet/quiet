/* eslint import/first: 0 */

import handlers, { CriticalError } from './criticalError'
import selectors from '../selectors/criticalError'
import create from '../create'

describe('criticalError reducer', () => {
  let store = null
  beforeEach(() => {
    store = create({
      initialState: {
        criticalError: { ...CriticalError }
      }
    })
    jest.clearAllMocks()
  })

  describe('handles actions -', () => {
    it('setCriticalError', () => {
      store.dispatch(handlers.actions.setCriticalError({
        message: 'This is an error',
        traceback: 'Error: This is an error'
      }))

      expect(selectors.criticalError(store.getState())).toMatchSnapshot()
    })
  })
})
