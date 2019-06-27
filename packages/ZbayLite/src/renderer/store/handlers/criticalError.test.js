/* eslint import/first: 0 */
import Immutable from 'immutable'

import handlers, { CriticalError } from './criticalError'
import selectors from '../selectors/criticalError'
import create from '../create'

describe('criticalError reducer', () => {
  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        criticalError: CriticalError()
      })
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
