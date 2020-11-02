import BigNumber from 'bignumber.js'

import { mapStateToProps } from './NodeStatus'

import create from '../../../store/create'
import { initialState } from '../../../store/handlers/node'

describe('NodeStatus', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: {
        node: {
          ...initialState,
          status: 'down',
          latestBlock: new BigNumber(100),
          currentBlock: new BigNumber(18)
        }
      }
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})
