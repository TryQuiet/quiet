/* eslint import/first: 0 */
import Immutable from 'immutable'

import handlers, { Coordinator } from './coordinator'
import selectors from '../selectors/coordinator'
import create from '../create'

describe('criticalError reducer', () => {
  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        coordinator: Coordinator()
      })
    })
    jest.clearAllMocks()
  })

  describe('handles actions -', () => {
    it('stopCoordinator', () => {
      store.dispatch(handlers.actions.stopCoordinator())
      expect(selectors.running(store.getState())).toEqual(false)
    })
    it('startCoordinator', () => {
      store.dispatch(handlers.actions.startCoordinator())
      expect(selectors.running(store.getState())).toEqual(true)
    })
  })
})
