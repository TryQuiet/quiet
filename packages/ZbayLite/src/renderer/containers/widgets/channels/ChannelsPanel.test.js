import Immutable from 'immutable'

import { ChannelsState } from '../../../store/handlers/channels'
import { mapStateToProps } from './ChannelsPanel'
import { createChannel } from '../../../testUtils'
import create from '../../../store/create'
import { NodeState } from '../../../store/handlers/node'
import { IdentityState } from '../../../store/handlers/identity'
import { LoaderState } from '../../../store/handlers/utils'
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
        }),
        identity: IdentityState({
          loader: LoaderState({ loading: false })
        })
      })
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})
