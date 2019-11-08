import Immutable from 'immutable'

import create from '../create'
import { actions, initialState, epics } from './txnTimestamps'
import selectors from '../selectors/txnTimestamps'
import { getVault } from '../../vault'
jest.mock('../../vault')

describe('Operations reducer handles ', () => {
  let store = null

  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        txnTimestamps: initialState
      })
    })
    jest.clearAllMocks()
    getVault.mockImplementation(() => ({
      transactionsTimestamps: {
        listTransactions: async () => [{ 123: 'test1' }, { 1234: 'test2' }]
      }
    }))
  })

  describe('actions', () => {
    it('- addTxnTimestamp', () => {
      store.dispatch(actions.addTxnTimestamp({ tnxs: { 123: '1234' } }))
      expect(selectors.tnxTimestamps(store.getState())).toMatchSnapshot()
    })
  })
  describe('epics', () => {
    it('- getTnxTimestamps', async () => {
      await store.dispatch(epics.getTnxTimestamps())
      expect(selectors.tnxTimestamps(store.getState())).toMatchSnapshot()
    })
  })
})
