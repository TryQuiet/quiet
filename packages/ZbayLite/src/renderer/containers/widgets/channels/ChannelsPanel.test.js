import Immutable from 'immutable'

import { ChannelsState } from '../../../store/handlers/channels'
import { mapStateToProps, mapDispatchToProps } from './ChannelsPanel'
import { createChannel } from '../../../testUtils'
import create from '../../../store/create'
import { NodeState } from '../../../store/handlers/node'

describe('ChannelsPanel', () => {
  let store = null

  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        node: NodeState({
          isTestnet: true
        }),
        channels: ChannelsState({
          data: Immutable.fromJS([createChannel(1), createChannel(2)])
        })
      })
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
  it('will receive right actions', () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
