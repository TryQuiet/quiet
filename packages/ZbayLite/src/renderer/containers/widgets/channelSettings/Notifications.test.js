/* eslint import/first: 0 */
import Immutable from 'immutable'
import * as R from 'ramda'

import { mapDispatchToProps, mapStateToProps } from './Notifications'

import { ChannelsState } from '../../../store/handlers/channels'
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
      initialState: Immutable.Map({
        notificationCenter: initialState,
        channel: ChannelState({
          spentFilterValue: 38,
          id: channelId,
          members: 0,
          message: 'This is a test message'
        }),
        messages: Immutable.Map({
          [channelId]: ChannelMessages({
            messages: Immutable.List(
              Immutable.fromJS(
                R.range(0, 4).map(id =>
                  ReceivedMessage(
                    createReceivedMessage({
                      id,
                      createdAt: now.minus({ hours: 2 * id }).toSeconds()
                    })
                  )
                )
              )
            )
          })
        }),
        channels: ChannelsState({
          data: Immutable.fromJS([createChannel(channelId)])
        })
      })
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
