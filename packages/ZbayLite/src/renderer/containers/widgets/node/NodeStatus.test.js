/* eslint import/first: 0 */
jest.mock('../../../vault')
import Immutable from 'immutable'

import { mapStateToProps } from './NodeStatus'

import create from '../../../store/create'
import { NodeState } from '../../../store/handlers/node'

describe('NodeStatus', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        node: NodeState({
          status: 'down',
          latestBlock: 100,
          currentBlock: 18
        })
      })
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})
