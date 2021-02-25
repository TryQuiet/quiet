/* eslint import/first: 0 */
import create from '../create'
import selectors from './tor'
import { initialState } from '../handlers/tor'
describe('rates selectors', () => {
  let store = null
  beforeEach(() => {
    store = create({
      tor: initialState
    })
    jest.clearAllMocks()
  })

  it('selects tor data', async () => {
    expect(selectors.tor(store.getState())).toMatchSnapshot()
  })
  it('selects torEnabled', async () => {
    expect(selectors.torEnabled(store.getState())).toMatchSnapshot()
  })
})
