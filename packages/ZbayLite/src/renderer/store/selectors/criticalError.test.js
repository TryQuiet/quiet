/* eslint import/first: 0 */
import Immutable from 'immutable'

import selectors from './criticalError'
import { CriticalError } from '../handlers/criticalError'

import create from '../create'

describe('criticalError -', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        criticalError: CriticalError({
          message: 'Some kind of error',
          traceback: 'Error: Traceback for Some kind of error'
        })
      })
    })
  })

  it('criticalError selector', async () => {
    expect(selectors.criticalError(store.getState())).toMatchSnapshot()
  })

  it('message selector', async () => {
    expect(selectors.message(store.getState())).toMatchSnapshot()
  })

  it('traceback selector', async () => {
    expect(selectors.traceback(store.getState())).toMatchSnapshot()
  })
})
