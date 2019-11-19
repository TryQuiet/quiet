import Immutable from 'immutable'

import create from '../create'
import { actions, initialState, epics, client } from './tor'
import selectors from '../selectors/tor'
import bootstrap from '../../../main/zcash/bootstrap'

jest.mock('../../vault')

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
      const ensureZcashParamsMock = jest
        .spyOn(bootstrap, 'ensureZcashParams')
        .mockImplementation((platform, callback) => callback())
      const spawnZcashNodeMock = jest
        .spyOn(bootstrap, 'spawnZcashNode')
        .mockImplementation(() => ({ on: () => {} }))

      await store.dispatch(epics.createZcashNode())
      expect(ensureZcashParamsMock).toHaveBeenCalled()
      expect(spawnZcashNodeMock).toHaveBeenCalled()
    })
  })
})
