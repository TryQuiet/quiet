import Immutable from 'immutable'

import create from '../../../store/create'
import { mapDispatchToProps, mapStateToProps } from './ChannelInfo'
import { ChannelState } from '../../../store/handlers/channel'
import { ChannelsState } from '../../../store/handlers/channels'
import { createChannel } from '../../../testUtils'

describe('ChannelInfo ', () => {
  let store = null
  const channelId = 'channel-id'
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        rates: Immutable.Map({ usd: '70.45230379033394', zec: '1' }),
        channel: ChannelState({
          id: channelId,
          shareableUri: 'uri',
          message: 'Message written in the input'
        }),
        channels: ChannelsState({
          data: Immutable.fromJS([createChannel(channelId)])
        })
      })
    })
    jest.clearAllMocks()
  })

  it('will receive right props', () => {
    const state = mapStateToProps(store.getState())
    expect(state).toMatchSnapshot()
  })

  it('will receive right actions', () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
