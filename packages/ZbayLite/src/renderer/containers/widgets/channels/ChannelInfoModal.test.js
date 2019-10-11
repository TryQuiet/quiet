/* eslint import/first: 0 */
import Immutable from 'immutable'
import BigNumber from 'bignumber.js'

import { mapStateToProps } from './ChannelInfoModal'

import create from '../../../store/create'
import { ChannelState } from '../../../store/handlers/channel'
import { ChannelsState } from '../../../store/handlers/channels'
import { createChannel } from '../../../testUtils'
import { NodeState } from '../../../store/handlers/node'

describe('ChannelInfoModal', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        node: NodeState({
          isTestnet: true
        }),
        channel: ChannelState({
          spentFilterValue: 38,
          id: 'this-is-a-test-id',
          shareableUri: 'zbay://channel/test-hash',
          members: new BigNumber(0),
          message: 'This is a test message',
          messages: []
        }),
        channels: ChannelsState({
          data: Immutable.fromJS([
            createChannel('this-is-a-test-id')
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
