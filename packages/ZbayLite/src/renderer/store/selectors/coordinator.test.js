/* eslint import/first: 0 */
import Immutable from 'immutable'

import selectors from './coordinator'
import { Coordinator } from '../handlers/coordinator'

import create from '../create'

describe('criticalError -', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        criticalError: Coordinator()
      })
    })
  })

  it('criticalError selector', async () => {
    expect(selectors.running(store.getState())).toMatchSnapshot()
  })
})
