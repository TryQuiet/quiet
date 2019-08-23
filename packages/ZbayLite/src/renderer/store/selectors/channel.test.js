/* eslint import/first: 0 */
jest.mock('../../vault')
import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'

import channelSelectors from './channel'
import { operationTypes, PendingMessageOp, Operation } from '../handlers/operations'
import create from '../create'
import { ChannelState } from '../handlers/channel'
import { ChannelsState } from '../handlers/channels'
import { IdentityState, Identity } from '../handlers/identity'
import { PendingMessage } from '../handlers/messagesQueue'
import { ReceivedMessage, ChannelMessages } from '../handlers/messages'
import { createMessage, createChannel, now, createReceivedMessage } from '../../testUtils'
import { LoaderState } from '../handlers/utils'
import { NodeState } from '../handlers/node'

const channelId = 'this-is-a-test-id'

const storeState = {
  identity: IdentityState({
    data: Identity({
      balance: new BigNumber(0),
      lockedBalance: new BigNumber(23)
    })
  }),
  node: NodeState({
    isTestnet: true
  }),
  channel: ChannelState({
    spentFilterValue: 38,
    id: channelId,
    shareableUri: 'zbay.io/channel/my-hash',
    members: new BigNumber(0),
    message: 'Message written in the input',
    loader: LoaderState({
      message: 'Test loading message',
      loading: true
    })
  }),
  messages: Immutable.Map({
    [channelId]: ChannelMessages({
      messages: Immutable.List(Immutable.fromJS(
        R.range(0, 4).map(id => ReceivedMessage(
          createReceivedMessage({ id, createdAt: now.minus({ hours: 2 * id }).toSeconds() })
        ))
      ))
    })
  }),
  channels: ChannelsState({
    data: Immutable.fromJS([createChannel(channelId)])
  }),
  messagesQueue: Immutable.Map({
    'messageHash': PendingMessage({
      channelId,
      message: Immutable.fromJS(
        createMessage('test-pending-message', now.minus({ hours: 2 }).toSeconds())
      )
    })
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
}

describe('Channel selector', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map(storeState)
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

  it('shareableUri', () => {
    expect(channelSelectors.shareableUri(store.getState())).toMatchSnapshot()
  })

  describe('inputLocked', () => {
    it('when balance=0 and lockedBalance > 0', () => {
      expect(channelSelectors.inputLocked(store.getState())).toBeTruthy()
    })

    it('when balance=0 and lockedBalance=0', () => {
      store = create({
        initialState: Immutable.Map({
          ...storeState,
          identity: IdentityState({
            data: Identity({
              balance: new BigNumber(0),
              lockedBalance: new BigNumber(0)
            })
          })
        })
      })
      expect(channelSelectors.inputLocked(store.getState())).toBeFalsy()
    })

    it('when balance > 0 and lockedBalance > 0', () => {
      store = create({
        initialState: Immutable.Map({
          ...storeState,
          identity: IdentityState({
            data: Identity({
              balance: new BigNumber(12),
              lockedBalance: new BigNumber(12)
            })
          })
        })
      })
      expect(channelSelectors.inputLocked(store.getState())).toBeFalsy()
    })

    it('when balance > 0 and lockedBalance=0', () => {
      store = create({
        initialState: Immutable.Map({
          ...storeState,
          identity: IdentityState({
            data: Identity({
              balance: new BigNumber(12),
              lockedBalance: new BigNumber(0)
            })
          })
        })
      })
      expect(channelSelectors.inputLocked(store.getState())).toBeFalsy()
    })
  })

  it('channelId', () => {
    expect(channelSelectors.channelId(store.getState())).toMatchSnapshot()
  })
})
