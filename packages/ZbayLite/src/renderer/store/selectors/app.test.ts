/* eslint import/first: 0 */
import selectors from './app'
import { initialState as AppState } from '../handlers/app'

import create from '../create'

describe('app -', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      app: {
        ...AppState,
        version: '0.13.37',
        transfers: {},
        modalTabToOpen: 'addFunds',
        allTransfersCount: 12,
        newTransfersCounter: 2
      }
    })
  })

  it('version selector', async () => {
    expect(selectors.version(store.getState())).toMatchSnapshot()
  })
  it('modal tab to open', async () => {
    expect(selectors.currentModalTab(store.getState())).toMatchSnapshot()
  })
  it('isInitialLoadFinished', async () => {
    expect(selectors.isInitialLoadFinished(store.getState())).toMatchSnapshot()
  })
})
