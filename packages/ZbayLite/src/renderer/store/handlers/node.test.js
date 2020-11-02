/* eslint import/first: 0 */
import create from '../create'
import nodeHandlers from './node'
import nodeSelectors from '../selectors/node'

describe('Node reducer handles', () => {
  let store = null
  beforeEach(() => {
    store = create()
    jest.clearAllMocks()
  })

  const assertStoreState = () => expect(
    nodeSelectors.node(store.getState())
  ).toMatchSnapshot()

  describe('epics -', () => {
    describe('getStatus', () => {
      it('when successfull', async () => {
        await store.dispatch(nodeHandlers.epics.getStatus())
        assertStoreState()
      })

      it('when node is down', async () => {
        try {
          await store.dispatch(nodeHandlers.epics.getStatus())
        } catch (err) {}
        assertStoreState()
      })
    })
  })
})
