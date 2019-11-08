/* eslint import/first: 0 */
jest.mock('../../vault')
import Immutable from 'immutable'

import create from '../create'
import selectors from './txnTimestamps'

describe('rates selectors', () => {
  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        txnTimestamps: Immutable.Map({ 123: 'test1', 1234: 'test2' })
      })
    })
    jest.clearAllMocks()
  })

  it('selects tnxTimestamps', async () => {
    expect(selectors.tnxTimestamps(store.getState())).toEqual(
      Immutable.Map({ 123: 'test1', 1234: 'test2' })
    )
  })
})
