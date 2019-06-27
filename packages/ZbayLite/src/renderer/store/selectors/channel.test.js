/* eslint import/first: 0 */
jest.mock('../../vault')
import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'

import channelSelectors from './channel'
import { operationTypes, PendingMessageOp, Operation } from '../handlers/operations'
import create from '../create'
import { ChannelState, MessagesState } from '../handlers/channel'
import { ChannelsState } from '../handlers/channels'
import { createMessage, createChannel, now } from '../../testUtils'
import { LoaderState } from '../handlers/utils'

describe('Channel selector', () => {
  const channelId = 'this-is-a-test-id'

  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        channel: ChannelState({
          spentFilterValue: 38,
          id: channelId,
          members: new BigNumber(0),
          message: 'Message written in the input',
          messages: MessagesState({
            data: Immutable.fromJS(
              R.range(0, 4)
                .map(i => createMessage(i, now.minus({ hours: 2 * i }).toSeconds()))
            ),
            loader: LoaderState({
              message: 'Test loading message',
              loading: true
            })
          })
        }),
        channels: ChannelsState({
          data: Immutable.fromJS([createChannel(channelId)])
        }),
        operations: Immutable.fromJS({
          'test-operation-id': Operation({
            opId: 'test-operation-id',
            txId: 'transaction-id',
            type: operationTypes.pendingMessage,
            meta: PendingMessageOp({
              message: Immutable.fromJS(createMessage(
                'test-message-id',
                now.minus({ hours: 1 }).toSeconds()
              )),
              channelId
            }),
            status: 'success'
          }),
          'test-operation-id-2': Operation({
            opId: 'test-operation-id-2',
            txId: 'transaction-id-2',
            type: operationTypes.pendingMessage,
            meta: PendingMessageOp({
              message: Immutable.fromJS(createMessage(
                'test-message-id-2',
                now.minus({ hours: 3 }).toSeconds()
              )),
              channelId: `not-${channelId}`
            }),
            status: 'success'
          }),
          'test-operation-id-3': Operation({
            opId: 'test-operation-id-3',
            txId: 'transaction-id-3',
            type: operationTypes.pendingMessage,
            meta: PendingMessageOp({
              message: Immutable.fromJS(createMessage(
                'test-message-id-3',
                now.minus({ hours: 5 }).toSeconds()
              )),
              channelId
            }),
            status: 'success'
          })
        })
      })
    })
  })

  it('channel selector', async () => {
    expect(channelSelectors.channel(store.getState())).toMatchSnapshot()
  })

  it('spent filter value selector', async () => {
    expect(channelSelectors.spentFilterValue(store.getState())).toMatchSnapshot()
  })

  it('message selector', async () => {
    expect(channelSelectors.message(store.getState())).toMatchSnapshot()
  })

  it('messages selector', async () => {
    expect(channelSelectors.messages(store.getState())).toMatchSnapshot()
  })

  it('data selector', async () => {
    expect(channelSelectors.data(store.getState())).toMatchSnapshot()
  })

  it('pendingMessages', () => {
    expect(channelSelectors.pendingMessages(store.getState())).toMatchSnapshot()
  })

  it('loader', () => {
    expect(channelSelectors.loader(store.getState())).toMatchSnapshot()
  })
})
