import Immutable from 'immutable'
import { ipcRenderer } from 'electron'

import create from '../create'
import { actions, initialState, epics, client } from './tor'
import selectors from '../selectors/tor'
import electronStore from '../../../shared/electronStore'

jest.mock('../../vault')
jest.mock('../../../shared/electronStore', () => ({
  set: () => {}
}))

describe('Tor reducer handles ', () => {
  let store = null

  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        tor: initialState
      })
    })
    jest.clearAllMocks()
  })

  describe('actions', () => {
    it('- setEnabled', () => {
      store.dispatch(actions.setEnabled({ enabled: true }))
      expect(selectors.tor(store.getState())).toMatchSnapshot()
    })
    it('- setUrl', () => {
      store.dispatch(actions.setUrl({ url: 'testhost:9999' }))
      expect(selectors.tor(store.getState())).toMatchSnapshot()
    })
    it('- setError', () => {
      store.dispatch(actions.setError({ error: 'error' }))
      expect(selectors.tor(store.getState())).toMatchSnapshot()
    })
    it('- setStatus', () => {
      store.dispatch(actions.setStatus({ status: 'up' }))
      expect(selectors.tor(store.getState())).toMatchSnapshot()
    })
  })
  describe('epics', () => {
    it('- checkTor', async () => {
      const connectMock = jest.spyOn(client, 'connect').mockImplementation(() => {})

      await store.dispatch(epics.checkTor())
      expect(connectMock).toHaveBeenCalled()
    })
    it('- createZcashNode', async () => {
      const spawnZcashNodeMock = jest
        .spyOn(ipcRenderer, 'send')
        .mockImplementation(() => ({ on: () => {} }))
      const electronStoreMock = jest.spyOn(electronStore, 'set').mockImplementation(() => {})
      await store.dispatch(epics.createZcashNode())
      expect(spawnZcashNodeMock).toHaveBeenCalled()
      expect(electronStoreMock).toHaveBeenCalled()
    })
  })
})
