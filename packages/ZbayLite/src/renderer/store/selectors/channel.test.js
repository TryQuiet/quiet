/* eslint import/first: 0 */
jest.mock('../../vault')
import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'

import channelSelectors, { INPUT_STATE, mergeIntoOne } from './channel'
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
import { receivedToDisplayableMessage } from '../../zbay/messages'
import { DOMAIN } from '../../../shared/static'

const channelId = 'this-is-a-test-id'
const uri = `https://${DOMAIN}/importchannel=channel-hash`

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
    shareableUri: uri,
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
    expect(channelSelectors.messages()(store.getState())).toMatchSnapshot()
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
      expect(channelSelectors.inputLocked(store.getState())).toEqual(INPUT_STATE.LOCKED)
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
      expect(channelSelectors.inputLocked(store.getState())).toEqual(INPUT_STATE.DISABLE)
    })

    it('when balance > 0.0002 and lockedBalance > 0.0002', () => {
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
      expect(channelSelectors.inputLocked(store.getState())).toEqual(INPUT_STATE.AVAILABLE)
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
      expect(channelSelectors.inputLocked(store.getState())).toEqual(INPUT_STATE.AVAILABLE)
    })
  })

  describe('mergeMessages', () => {
    it('merge messages', () => {
      const messages = [{
        message: {
          createdAt: 1567683647,
          id: 'test-1',
          type: 1,
          message: 'test-1',
          sender: {
            replyTo: '',
            username: 'test123'
          },
          receiver: {
            replyTo: '',
            username: 'test123'
          },
          status: 'succes'
        },
        identityAddress: 'zs0123'
      },
      {
        message: {
          createdAt: 1567683757,
          id: 'test-2',
          type: 1,
          message: 'test-2',
          sender: {
            replyTo: '',
            username: 'test123'
          },
          receiver: {
            replyTo: '',
            username: 'test123'
          },
          status: 'success'
        },
        identityAddress: 'zs0123'
      }]

      const displayableMessages = messages.map(msg => receivedToDisplayableMessage(msg))
      const merged = mergeIntoOne(displayableMessages)
      expect(merged).toMatchSnapshot()
    })

    it('should not merge messages if time window is exceeded', () => {
      const messages = [{
        message: {
          createdAt: 1567683647,
          id: 'test-1',
          type: 1,
          message: 'test-1',
          sender: {
            replyTo: '',
            username: 'test123'
          },
          receiver: {
            replyTo: '',
            username: 'test123'
          },
          status: 'succes'
        },
        identityAddress: 'zs0123'
      },
      {
        message: {
          createdAt: 1567683987,
          id: 'test-2',
          type: 1,
          message: 'test-2',
          sender: {
            replyTo: '',
            username: 'test123'
          },
          receiver: {
            replyTo: '',
            username: 'test123'
          },
          status: 'success'
        },
        identityAddress: 'zs0123'
      }]

      const displayableMessages = messages.map(msg => receivedToDisplayableMessage(msg))
      const merged = mergeIntoOne(displayableMessages)
      expect(merged).toMatchSnapshot()
    })

    it('should not merge message with error', () => {
      const messages = [{
        message: {
          createdAt: 1567683647,
          id: 'test-1',
          type: 1,
          message: 'test-1',
          sender: {
            replyTo: '',
            username: 'test123'
          },
          receiver: {
            replyTo: '',
            username: 'test123'
          },
          status: 'success'
        },
        identityAddress: 'zs0123'
      },
      {
        message: {
          createdAt: 1567683767,
          id: 'test-2',
          type: 1,
          message: 'test-2',
          sender: {
            replyTo: '',
            username: 'test123'
          },
          receiver: {
            replyTo: '',
            username: 'test123'
          },
          status: 'success'
        },
        identityAddress: 'zs0123'
      },
      {
        message: {
          createdAt: 1567683787,
          id: 'test-3',
          type: 1,
          message: 'message with error',
          sender: {
            replyTo: '',
            username: 'test123'
          },
          receiver: {
            replyTo: '',
            username: 'test123'
          },
          status: 'failed'
        },
        identityAddress: 'zs0123'
      }]

      const displayableMessages = messages.map(msg => receivedToDisplayableMessage(msg))
      const merged = mergeIntoOne(displayableMessages)
      expect(merged).toMatchSnapshot()
    })

    it('should not merge message with different type', () => {
      const messages = [{
        message: {
          createdAt: 1567683647,
          id: 'test-1',
          type: 4,
          message: 'test-1',
          sender: {
            replyTo: '',
            username: 'test123'
          },
          receiver: {
            replyTo: '',
            username: 'test123'
          },
          status: 'success'
        },
        identityAddress: 'zs0123'
      },
      {
        message: {
          createdAt: 1567683767,
          id: 'test-2',
          type: 4,
          message: 'test-2',
          sender: {
            replyTo: '',
            username: 'test123'
          },
          receiver: {
            replyTo: '',
            username: 'test123'
          },
          status: 'success'
        },
        identityAddress: 'zs0123'
      },
      {
        message: {
          createdAt: 1567683787,
          id: 'test-3',
          type: 1,
          message: 'test3',
          sender: {
            replyTo: '',
            username: 'test123'
          },
          receiver: {
            replyTo: '',
            username: 'test123'
          },
          status: 'success'
        },
        identityAddress: 'zs0123'
      }]

      const displayableMessages = messages.map(msg => receivedToDisplayableMessage(msg))
      const merged = mergeIntoOne(displayableMessages)
      expect(merged).toMatchSnapshot()
    })
  })

  it('channelId', () => {
    expect(channelSelectors.channelId(store.getState())).toMatchSnapshot()
  })

  describe('channel owner selector', () => {
    const messages = [{
      createdAt: 1567683647,
      id: 'test-1',
      type: 6,
      message: {
        minFee: '100',
        onlyRegistered: '1',
        owner: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d'
      },
      publicKey: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d',
      sender: {
        replyTo: '',
        username: 'test123'
      }
    },
    {
      createdAt: 1567683687,
      id: 'test-1',
      type: 6,
      message: {
        minFee: '100',
        onlyRegistered: '1',
        owner: 'random-public-key'
      },
      publicKey: 'random-public-key',
      sender: {
        replyTo: '',
        username: 'test123'
      }
    },
    {
      createdAt: 1567683747,
      id: 'test-1',
      type: 6,
      message: {
        minFee: '100',
        onlyRegistered: '1',
        owner: 'random-public-key-2'
      },
      publicKey: 'random-public-key-2',
      sender: {
        replyTo: '',
        username: 'test123'
      }
    }
    ]
    const baseStore = { identity: IdentityState({
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
      shareableUri: uri,
      members: new BigNumber(0),
      message: 'Message written in the input',
      loader: LoaderState({
        message: 'Test loading message',
        loading: true
      })
    }),
    channels: ChannelsState({
      data: Immutable.fromJS([createChannel(channelId)])
    }) }
    it('channel owner', () => {
      store = create({
        initialState: Immutable.Map({
          ...baseStore,
          messages: Immutable.Map({
            [channelId]: ChannelMessages({
              messages: Immutable.List(Immutable.fromJS(messages)
              )
            })
          })
        })
      })
      expect(channelSelectors.channelOwner(store.getState())).toEqual('03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d')
    })
    it('should return new channel owner', () => {
      const messages = [{
        createdAt: 1567683647,
        id: 'test-1',
        type: 6,
        message: {
          minFee: '100',
          onlyRegistered: '1',
          owner: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d'
        },
        publicKey: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d',
        sender: {
          replyTo: '',
          username: 'test123'
        }
      },
      {
        createdAt: 1567683687,
        id: 'test-1',
        type: 6,
        message: {
          minFee: '100',
          onlyRegistered: '1',
          owner: 'random-public-key'
        },
        publicKey: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d',
        sender: {
          replyTo: '',
          username: 'test123'
        }
      },
      {
        createdAt: 1567683747,
        id: 'test-1',
        type: 6,
        message: {
          minFee: '100',
          onlyRegistered: '1',
          owner: 'random-public-key-2'
        },
        publicKey: 'random-public-key-2',
        sender: {
          replyTo: '',
          username: 'test123'
        }
      }
      ]
      store = create({
        initialState: Immutable.Map({
          ...baseStore,
          messages: Immutable.Map({
            [channelId]: ChannelMessages({
              messages: Immutable.List(Immutable.fromJS(messages)
              )
            })
          })
        })
      })
      expect(channelSelectors.channelOwner(store.getState())).toEqual('random-public-key')
    })
  })
  describe('channel moderators selector', () => {
    const messages = [
      {
        createdAt: 1567683687,
        id: 'test-1',
        type: 6,
        message: {
          minFee: '100',
          onlyRegistered: '1',
          owner: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d'
        },
        publicKey: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d',
        sender: {
          replyTo: '',
          username: 'test123'
        }
      },
      {
        createdAt: 1567683647,
        id: 'test-1',
        type: 7,
        message: {
          moderationType: 'ADD_MOD',
          moderationTarget: 'new-moderator-public-key'
        },
        publicKey: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d',
        sender: {
          replyTo: '',
          username: 'test123'
        }
      },
      {
        createdAt: 1567683747,
        id: 'test-1',
        type: 7,
        message: {
          moderationType: 'ADD_MOD',
          moderationTarget: 'fake-moderator-public-key'
        },
        publicKey: 'random-public-key-2',
        sender: {
          replyTo: '',
          username: 'test123'
        }
      }
    ]
    const baseStore = { identity: IdentityState({
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
      shareableUri: uri,
      members: new BigNumber(0),
      message: 'Message written in the input',
      loader: LoaderState({
        message: 'Test loading message',
        loading: true
      })
    }),
    channels: ChannelsState({
      data: Immutable.fromJS([createChannel(channelId)])
    }) }
    it('add channel moderator', () => {
      store = create({
        initialState: Immutable.Map({
          ...baseStore,
          messages: Immutable.Map({
            [channelId]: ChannelMessages({
              messages: Immutable.List(Immutable.fromJS(messages)
              )
            })
          })
        })
      })
      expect(channelSelectors.getFilteredContext(store.getState())).toEqual(Immutable.fromJS({
        channelModerators: ['new-moderator-public-key'],
        messsagesToRemove: [],
        blockedUsers: [],
        visibleMessages: []
      }))
    })
    it('remove channel moderator', () => {
      const messages = [
        {
          createdAt: 1567683687,
          id: 'test-1',
          type: 6,
          message: {
            minFee: '100',
            onlyRegistered: '1',
            owner: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d'
          },
          publicKey: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d',
          sender: {
            replyTo: '',
            username: 'test123'
          }
        },
        {
          createdAt: 1567683647,
          id: 'test-1',
          type: 7,
          message: {
            moderationType: 'ADD_MOD',
            moderationTarget: 'new-moderator-public-key-2'
          },
          publicKey: 'fake-add-mod-user-public-key',
          sender: {
            replyTo: '',
            username: 'test123'
          }
        },
        {
          createdAt: 1567683647,
          id: 'test-1',
          type: 7,
          message: {
            moderationType: 'ADD_MOD',
            moderationTarget: 'new-moderator-public-key'
          },
          publicKey: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d',
          sender: {
            replyTo: '',
            username: 'test123'
          }
        },
        {
          createdAt: 1567683647,
          id: 'test-1',
          type: 7,
          message: {
            moderationType: 'REMOVE_MOD',
            moderationTarget: 'new-moderator-public-key-2'
          },
          publicKey: 'fake-remove-mod-user-public-key',
          sender: {
            replyTo: '',
            username: 'test123'
          }
        },
        {
          createdAt: 1567683747,
          id: 'test-1',
          type: 7,
          message: {
            moderationType: 'REMOVE_MOD',
            moderationTarget: 'new-moderator-public-key'
          },
          publicKey: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d',
          sender: {
            replyTo: '',
            username: 'test123'
          }
        }
      ]
      store = create({
        initialState: Immutable.Map({
          ...baseStore,
          messages: Immutable.Map({
            [channelId]: ChannelMessages({
              messages: Immutable.List(Immutable.fromJS(messages)
              )
            })
          })
        })
      })
      expect(channelSelectors.getFilteredContext(store.getState())).toEqual(Immutable.fromJS({
        channelModerators: [],
        messsagesToRemove: [],
        blockedUsers: [],
        visibleMessages: []
      }))
    })
    it('not fail if moderator to remove is not in moderator list', () => {
      const messages = [
        {
          createdAt: 1567683687,
          id: 'test-1',
          type: 6,
          message: {
            minFee: '100',
            onlyRegistered: '1',
            owner: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d'
          },
          publicKey: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d',
          sender: {
            replyTo: '',
            username: 'test123'
          }
        },
        {
          createdAt: 1567683747,
          id: 'test-1',
          type: 7,
          message: {
            moderationType: 'REMOVE_MOD',
            moderationTarget: 'new-moderator-public-key'
          },
          publicKey: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d',
          sender: {
            replyTo: '',
            username: 'test123'
          }
        }
      ]
      store = create({
        initialState: Immutable.Map({
          ...baseStore,
          messages: Immutable.Map({
            [channelId]: ChannelMessages({
              messages: Immutable.List(Immutable.fromJS(messages)
              )
            })
          })
        })
      })
      expect(channelSelectors.getFilteredContext(store.getState())).toEqual(Immutable.fromJS({
        channelModerators: [],
        messsagesToRemove: [],
        blockedUsers: [],
        visibleMessages: []
      }))
    })
  })
  describe('channel blocked users selector', () => {
    const messages = [
      {
        createdAt: 1567683687,
        id: 'test-1',
        type: 6,
        message: {
          minFee: '100',
          onlyRegistered: '1',
          owner: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d'
        },
        publicKey: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d',
        sender: {
          replyTo: '',
          username: 'test123'
        }
      },
      {
        createdAt: 1567683647,
        id: 'test-1',
        type: 7,
        message: {
          moderationType: 'BLOCK_USER',
          moderationTarget: 'new-blocked-user-public-key-added-by-channel-owner'
        },
        publicKey: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d',
        sender: {
          replyTo: '',
          username: 'test123'
        }
      },
      {
        createdAt: 1567683747,
        id: 'test-1',
        type: 7,
        message: {
          moderationType: 'ADD_MOD',
          moderationTarget: 'new-moderator-public-key'
        },
        publicKey: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d',
        sender: {
          replyTo: '',
          username: 'test123'
        }
      },
      {
        createdAt: 1567683647,
        id: 'test-1',
        type: 7,
        message: {
          moderationType: 'BLOCK_USER',
          moderationTarget: 'new-blocked-user-public-key-added-by-channel-moderator'
        },
        publicKey: 'new-moderator-public-key',
        sender: {
          replyTo: '',
          username: 'test123'
        }
      },
      {
        createdAt: 1567683647,
        id: 'test-1',
        type: 7,
        message: {
          moderationType: 'UNBLOCK_USER',
          moderationTarget: 'new-blocked-user-public-key-added-by-channel-moderator'
        },
        publicKey: 'fake-unblock-user-public-key',
        sender: {
          replyTo: '',
          username: 'test123'
        }
      }
    ]
    const baseStore = { identity: IdentityState({
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
      shareableUri: uri,
      members: new BigNumber(0),
      message: 'Message written in the input',
      loader: LoaderState({
        message: 'Test loading message',
        loading: true
      })
    }),
    channels: ChannelsState({
      data: Immutable.fromJS([createChannel(channelId)])
    }) }
    it('blocked channel users', () => {
      store = create({
        initialState: Immutable.Map({
          ...baseStore,
          messages: Immutable.Map({
            [channelId]: ChannelMessages({
              messages: Immutable.List(Immutable.fromJS(messages)
              )
            })
          })
        })
      })
      expect(channelSelectors.getFilteredContext(store.getState())).toEqual(Immutable.fromJS({
        channelModerators: ['new-moderator-public-key'],
        messsagesToRemove: [],
        blockedUsers: ['new-blocked-user-public-key-added-by-channel-owner', 'new-blocked-user-public-key-added-by-channel-moderator'],
        visibleMessages: []
      }))
    })
    it('should unblock user blocked by channel owner', () => {
      const messages = [
        {
          createdAt: 1567683687,
          id: 'test-1',
          type: 6,
          message: {
            minFee: '100',
            onlyRegistered: '1',
            owner: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d'
          },
          publicKey: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d',
          sender: {
            replyTo: '',
            username: 'test123'
          }
        },
        {
          createdAt: 1567683647,
          id: 'test-1',
          type: 7,
          message: {
            moderationType: 'BLOCK_USER',
            moderationTarget: 'new-blocked-user-public-key-added-by-channel-owner'
          },
          publicKey: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d',
          sender: {
            replyTo: '',
            username: 'test123'
          }
        },
        {
          createdAt: 1567683747,
          id: 'test-1',
          type: 7,
          message: {
            moderationType: 'ADD_MOD',
            moderationTarget: 'new-moderator-public-key'
          },
          publicKey: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d',
          sender: {
            replyTo: '',
            username: 'test123'
          }
        },
        {
          createdAt: 1567683647,
          id: 'test-1',
          type: 7,
          message: {
            moderationType: 'BLOCK_USER',
            moderationTarget: 'new-blocked-user-public-key-added-by-channel-moderator'
          },
          publicKey: 'new-moderator-public-key',
          sender: {
            replyTo: '',
            username: 'test123'
          }
        },
        {
          createdAt: 1567683647,
          id: 'test-1',
          type: 7,
          message: {
            moderationType: 'UNBLOCK_USER',
            moderationTarget: 'new-blocked-user-public-key-added-by-channel-moderator'
          },
          publicKey: 'fake-unblock-user-public-key',
          sender: {
            replyTo: '',
            username: 'test123'
          }
        },
        {
          createdAt: 1567683647,
          id: 'test-1',
          type: 7,
          message: {
            moderationType: 'UNBLOCK_USER',
            moderationTarget: 'new-blocked-user-public-key-added-by-channel-owner'
          },
          publicKey: 'new-moderator-public-key',
          sender: {
            replyTo: '',
            username: 'test123'
          }
        }
      ]
      store = create({
        initialState: Immutable.Map({
          ...baseStore,
          messages: Immutable.Map({
            [channelId]: ChannelMessages({
              messages: Immutable.List(Immutable.fromJS(messages)
              )
            })
          })
        })
      })
      expect(channelSelectors.getFilteredContext(store.getState())).toEqual(Immutable.fromJS({
        channelModerators: ['new-moderator-public-key'],
        messsagesToRemove: [],
        blockedUsers: ['new-blocked-user-public-key-added-by-channel-moderator'],
        visibleMessages: []
      }))
    })
  })
  describe('should not display messages after user was blocked', () => {
    const messages = [
      {
        createdAt: 1567683687,
        id: 'test-1',
        type: 6,
        message: {
          minFee: '100',
          onlyRegistered: '1',
          owner: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d'
        },
        publicKey: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d',
        sender: {
          replyTo: '',
          username: 'test123'
        }
      },
      {
        createdAt: 1567683647,
        id: 'test-1-basic',
        type: 1,
        message: {
          message: 'test-msg'
        },
        publicKey: 'public-key-user-to-block',
        sender: {
          replyTo: '',
          username: 'test123'
        }
      },
      {
        createdAt: 1567683647,
        id: 'test-2-basic',
        type: 1,
        message: {
          message: 'test-msg'
        },
        publicKey: 'public-key-user-to-block',
        sender: {
          replyTo: '',
          username: 'test123'
        }
      },
      {
        createdAt: 1567683747,
        id: 'test-1',
        type: 7,
        message: {
          moderationType: 'ADD_MOD',
          moderationTarget: 'new-moderator-public-key'
        },
        publicKey: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d',
        sender: {
          replyTo: '',
          username: 'test123'
        }
      },
      {
        createdAt: 1567683647,
        id: 'test-1',
        type: 7,
        message: {
          moderationType: 'BLOCK_USER',
          moderationTarget: 'public-key-user-to-block'
        },
        publicKey: 'new-moderator-public-key',
        sender: {
          replyTo: '',
          username: 'test123'
        }
      },
      {
        createdAt: 1567683647,
        id: 'test-1-basic-3',
        type: 1,
        message: {
          message: 'test-msg'
        },
        publicKey: 'public-key-user-to-block',
        sender: {
          replyTo: '',
          username: 'test123'
        }
      }
    ]
    const baseStore = { identity: IdentityState({
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
      shareableUri: uri,
      members: new BigNumber(0),
      message: 'Message written in the input',
      loader: LoaderState({
        message: 'Test loading message',
        loading: true
      })
    }),
    channels: ChannelsState({
      data: Immutable.fromJS([createChannel(channelId)])
    }) }
    it('not display blocked user messages', () => {
      store = create({
        initialState: Immutable.Map({
          ...baseStore,
          messages: Immutable.Map({
            [channelId]: ChannelMessages({
              messages: Immutable.List(Immutable.fromJS(messages)
              )
            })
          })
        })
      })
      expect(channelSelectors.getFilteredContext(store.getState())).toMatchSnapshot()
      expect(channelSelectors.getChannelFilteredMessages(store.getState())).toMatchSnapshot()
    })
  })
})
