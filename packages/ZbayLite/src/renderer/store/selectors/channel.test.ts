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
      id: '',
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
    }
  }

  it('- input_avilable_with_money', async () => {
    const store = create({
      ...initialState,
      identity: {
        ...initialState.identity,
        data: {
          ...initialState.identity.data,
          balance: new BigNumber('5'),
          lockedBalance: new BigNumber('5'),
          signerPubKey: 'kolega'
        }
      },
      users: {
        ...initialState.users,
        kolega: {
          ...initialState.users.kolega,
          createdAt: 555
        }
      }
    })
    expect(channelSelectors.inputLocked(store.getState())).toEqual(INPUT_STATE.AVAILABLE)
  })

  it('- input_avilable_without_money_with_online_contact', async () => {
    const store = create({
      ...initialState,
      channel: {
        ...initialState.channel,
        id: 'klucz'
      },
      contacts: {
        ...initialState.contacts,
        kumpel: {
          ...initialState.contacts.kumpel,
          key: 'klucz',
          connected: true
        }
      }
    })
    expect(channelSelectors.inputLocked(store.getState())).toEqual(INPUT_STATE.AVAILABLE)
  })
})
