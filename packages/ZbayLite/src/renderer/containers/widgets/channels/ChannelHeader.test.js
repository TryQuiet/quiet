/* eslint import/first: 0 */
jest.mock('../../../vault')
import Immutable from 'immutable'

import { mapStateToProps } from './ChannelHeader'

import create from '../../../store/create'
import { ChannelState } from '../../../store/handlers/channel'
import { ChannelsState } from '../../../store/handlers/channels'
import { createChannel } from '../../../testUtils'
import { NodeState } from '../../../store/handlers/node'

describe('ChannelHeader', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        channel: ChannelState({
          spentFilterValue: 38,
          id: 1
        }),
        node: NodeState({
          isTestnet: true
        }),
        channels: ChannelsState({
          data: Immutable.fromJS([
            createChannel(1),
            createChannel(2)
          ])
        })
      })
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})
