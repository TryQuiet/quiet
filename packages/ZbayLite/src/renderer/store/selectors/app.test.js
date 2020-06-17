/* eslint import/first: 0 */
import Immutable from 'immutable'

import selectors from './app'
import { AppState } from '../handlers/app'

import create from '../create'

describe('app -', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        app: AppState({
          version: '0.13.37',
          transfers: Immutable.Map(),
          modalTabToOpen: 'addFunds',
          allTransfersCount: 12,
          newTransfersCounter: 2
        })
      })
    })
  })

  it('version selector', async () => {
    expect(selectors.version(store.getState())).toMatchSnapshot()
  })
  it('version transfers', async () => {
    expect(selectors.transfers(store.getState())).toMatchSnapshot()
  })
  it('modal tab to open', async () => {
    expect(selectors.currentModalTab(store.getState())).toMatchSnapshot()
  })
  it('allTransfersCount', async () => {
    expect(selectors.allTransfersCount(store.getState())).toMatchSnapshot()
  })
  it('newTransfersCounter', async () => {
    expect(selectors.newTransfersCounter(store.getState())).toMatchSnapshot()
  })
  it('messageQueueLock', async () => {
    expect(selectors.messageQueueLock(store.getState())).toMatchSnapshot()
  })
  it('directMessageQueueLock', async () => {
    expect(selectors.directMessageQueueLock(store.getState())).toMatchSnapshot()
  })
  it('isInitialLoadFinished', async () => {
    expect(selectors.isInitialLoadFinished(store.getState())).toMatchSnapshot()
  })
})
