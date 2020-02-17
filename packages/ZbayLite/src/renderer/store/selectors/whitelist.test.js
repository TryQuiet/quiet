/* eslint import/first: 0 */
import Immutable from 'immutable'

import create from '../create'
import selectors from './whitelist'

describe('users selectors', () => {
  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        whitelist: {
          allowAll: false,
          whitelisted: Immutable.List(['test1', 'test2']),
          autoload: Immutable.List(['test3', 'test4'])
        }
      })
    })
    jest.clearAllMocks()
  })

  it(' - allowAll', () => {
    expect(selectors.allowAll(store.getState())).toMatchSnapshot()
  })

  it(' - whitelisted', () => {
    expect(selectors.whitelisted(store.getState())).toMatchSnapshot()
  })
  it(' - autoload', () => {
    expect(selectors.autoload(store.getState())).toMatchSnapshot()
  })
})
