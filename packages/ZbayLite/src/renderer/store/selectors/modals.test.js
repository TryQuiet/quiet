/* eslint import/first: 0 */
import create from '../create'
import selectors from './modals'

describe('modals selectors', () => {
  const modalName = 'testModal'
  let store = null
  beforeEach(() => {
    store = create({
      initialState: {
        modals: {
          [modalName]: true
        }
      }
    })
    jest.clearAllMocks()
  })

  it('- modals', () => {
    expect(selectors.modals(store.getState())).toMatchSnapshot()
  })

  it('- open', () => {
    expect(selectors.open(store.getState())).toBeTruthy()
  })
})
