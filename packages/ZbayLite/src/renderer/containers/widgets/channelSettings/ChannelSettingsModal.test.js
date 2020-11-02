/* eslint import/first: 0 */
import BigNumber from 'bignumber.js'

import { mapDispatchToProps, mapStateToProps } from './ChannelSettingsModal'

import { ChannelState } from '../../../store/handlers/channel'
import { initialState } from '../../../store/handlers/channels'
import { createChannel } from '../../../testUtils'
import { ChannelMessages } from '../../../store/handlers/messages'

import create from '../../../store/create'

const channelId = 'randomid'
const baseStore = {
  channel: {
    ...ChannelState,
    spentFilterValue: 38,
    id: channelId,
    shareableUri: 'testuri',
    members: new BigNumber(0),
    message: 'Message written in the input'
  },
  channels: {
    ...initialState,
    data: [createChannel(channelId)]
  }
}
describe('Send message popover', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: {
        ...baseStore,
        messages: {
          [channelId]: {
            ...ChannelMessages
          }
        }
      }
    })
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
