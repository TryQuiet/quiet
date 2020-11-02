/* eslint import/first: 0 */
import create from '../create'
import selectors from './whitelist'

describe('users selectors', () => {
  let store = null
  beforeEach(() => {
    store = create({
      initialState: {
        whitelist: {
          allowAll: false,
          whitelisted: ['test1', 'test2'],
          autoload: ['test3', 'test4']
        }
      }
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
