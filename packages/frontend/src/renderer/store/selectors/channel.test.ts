/* eslint import/first: 0 */
import channelSelectors, { INPUT_STATE } from './channel'

import create from '../create'

import BigNumber from 'bignumber.js'
import { Contact } from '../handlers/contacts'

describe('Channel selectors', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      channel: {
        spentFilterValue: new BigNumber(0),
        message: {},
        shareableUri: '',
        address: '',
        loader: { loading: false, message: '' },
        members: {},
        showInfoMsg: true,
        isSizeCheckingInProgress: false,
        displayableMessageLimit: 50,
        id: 123
      },
      contacts: {
        123: new Contact()
      }
    })
  })

  it('- data', async () => {
    expect(channelSelectors.data(store.getState())).toMatchInlineSnapshot(`
      Contact {
        "address": "",
        "key": "",
        "messages": Array [],
        "newMessages": Array [],
        "typingIndicator": false,
        "username": "",
        "vaultMessages": Array [],
        Symbol(immer-draftable): true,
      }
    `)
  })

  const initialState = {
    identity: {
      data: {
        id: '',
        address: '',
        transparentAddress: '',
        signerPrivKey: '',
        signerPubKey: '',
        name: '',
        shippingData: {
          firstName: '',
          lastName: '',
          street: '',
          country: '',
          region: '',
          city: '',
          postalCode: ''
        },
        balance: new BigNumber('0'),
        lockedBalance: new BigNumber('0'),
        donationAllow: true,
        shieldingTax: true,
        donationAddress: '',
        onionAddress: '',
        freeUtxos: 0,
        addresses: [''],
        shieldedAddresses: ['']
      }
    },
    users: {
      kolega: {
        key: '',
        firstName: '',
        publicKey: '',
        lastName: '',
        nickname: '',
        address: '',
        onionAddress: '',
        createdAt: 0
      }
    },
    channel: {
      spentFilterValue: {},
      id: 'anonfriend',
      message: {},
      shareableUri: '',
      address: '',
      loader: {},
      members: {},
      showInfoMsg: true,
      isSizeCheckingInProgress: true,
      messageSizeStatus: true,
      displayableMessageLimit: 0
    },
    contacts: {
      kumpel: {
        lastSeen: {},
        key: '',
        username: '',
        address: '',
        newMessages: [],
        vaultMessages: [],
        messages: [],
        offerId: '',
        unread: 0,
        connected: false
      }
    },
    waggle: {
      isWaggleConnected: false
    },
    directMessages: {
      users: {},
      conversations: {},
      conversationsList: {},
      privateKey: '',
      publicKey: ''
    }
  }

  it('- input_when_waggle_disconnected', async () => {
    const store = create({
      ...initialState
    })
    expect(channelSelectors.inputLocked(store.getState())).toEqual(INPUT_STATE.NOT_CONNECTED)
  })

  it('- input_when_waggle_connected_but_channel_is_not_DM_or_public_channel', async () => {
    const store = create({
      ...initialState,
      waggle: {
        isWaggleConnected: true
      },
      directMessages: {
        ...initialState.directMessages,
        users: {
          anonfriend: {
            publicKey: 'friend',
            nickname: 'anonfriend'
          }

        }
      }
    })
    expect(channelSelectors.inputLocked(store.getState())).toEqual(INPUT_STATE.USER_NOT_REGISTERED)
  })

  it('- input_when_waggle_is_connected_and_is_dm_channel', async () => {
    const store = create({
      ...initialState,
      waggle: {
        isWaggleConnected: true
      },
      directMessages: {
        users: {
          friend: {
            publicKey: 'friend'
          }
        }
      },
      users: {
        somebody: {
          key: '',
          firstName: '',
          publicKey: 'friend',
          lastName: '',
          nickname: '',
          address: '',
          onionAddress: '',
          createdAt: 0
        }
      },
      channel: {
        id: 'friend'
      }
    })
    expect(channelSelectors.inputLocked(store.getState())).toEqual(INPUT_STATE.AVAILABLE)
  })
})
