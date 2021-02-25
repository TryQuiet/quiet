/* eslint import/first: 0 */
import * as R from 'ramda'

import { mapDispatchToProps, mapStateToProps } from './Notifications'

import create from '../../../store/create'
import { initialState } from '../../../store/handlers/notificationCenter'
import { createReceivedMessage, now, createChannel } from '../../../testUtils'
import { ChannelState } from '../../../store/handlers/channel'
import {
  ReceivedMessage,
  ChannelMessages
} from '../../../store/handlers/messages'
const channelId = 'channelid'
describe('Send message popover', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      notificationCenter: {
        ...initialState
      },
      channel: {
        ...ChannelState,
        spentFilterValue: 38,
        id: channelId,
        members: 0,
        message: 'This is a test message'
      },
      channels: {
        data: [createChannel(channelId)]
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
