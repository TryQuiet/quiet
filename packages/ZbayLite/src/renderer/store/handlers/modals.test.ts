/* eslint import/first: 0 */
import create from '../create'
import modalsHandlers from './modals'
import modalsSelectors from '../selectors/modals'

describe('Modals reducer', () => {
  let store = null
  beforeEach(() => {
    store = create()
    jest.clearAllMocks()
  })

  const modalName = 'modalTester'
  const openModal = modalsHandlers.actionCreators.openModal(modalName)
  const closeModal = modalsHandlers.actionCreators.closeModal(modalName)
  const isOpen = modalsSelectors.open(modalName)

  it('opens modal', () => {
    expect(isOpen(store.getState())).toBeFalsy()

    store.dispatch(openModal())

    expect(isOpen(store.getState())).toBeTruthy()
  })

  it('closes modal', () => {
    store.dispatch(openModal())
    expect(isOpen(store.getState())).toBeTruthy()

    store.dispatch(closeModal())

    expect(isOpen(store.getState())).toBeFalsy()
  })
})
