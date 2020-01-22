import Immutable from 'immutable'

import { mapStateToProps } from './SyncLoader'
import create from '../../store/create'
import { NodeState } from '../../store/handlers/node'

jest.mock('../../../shared/electronStore', () => ({
  set: () => {},
  get: () => {}
}))

describe('SyncLoader', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        node: NodeState({
          currentBlock: 1,
          latestBlock: 100
        })
      })
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})
