/* eslint import/first: 0 */
jest.mock('../../vault')
import Immutable from 'immutable'

import create from '../create'
import selectors from './tor'
import { initialState } from '../handlers/tor'
describe('rates selectors', () => {
  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        tor: initialState
      })
    })
    jest.clearAllMocks()
  })

  it('selects tor data', async () => {
    expect(selectors.tor(store.getState())).toMatchSnapshot()
  })
})
