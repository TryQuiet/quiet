import create from '../create'
import { actions, initialState, epics } from './txnTimestamps'
import selectors from '../selectors/txnTimestamps'

describe('Operations reducer handles ', () => {
  let store = null

  beforeEach(() => {
    store = create({
      initialState: {
        txnTimestamps: {
          ...initialState
        }
      }
    })
    jest.clearAllMocks()
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
