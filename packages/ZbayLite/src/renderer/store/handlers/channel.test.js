/* eslint import/first: 0 */
jest.mock('../../zcash')
jest.mock('./messagesQueue', () => ({
  ...jest.requireActual('./messagesQueue'),
  epics: {
    addMessage: jest.fn(() => jest.fn().mockResolvedValue())
  }
}))

import { DateTime } from 'luxon'

import create from '../create'
import { ChannelState, actions } from './channel'

import { ChannelsState } from './channels'
import { initialState } from './identity'
import channelSelectors from '../selectors/channel'
import {
  now
} from '../../testUtils'
import { NodeState } from './node'

describe('channel reducer', () => {
  const identityId = 'test-identity-id'
  const address =
    'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya'
  let channel

  let store = null
  beforeEach(async () => {
    window.Notification = jest.fn()

    store = create({
      channel: {
        ...ChannelState
      },
      channels: {
        ...ChannelsState,
        data: [channel]
      },
      node: {
        ...NodeState,
        isTestnet: true
      },
      identity: {
        ...initialState,
        data: {
          ...initialState.data,
          id: identityId,
          address,
          name: 'Saturn',
          balance: '33.583004',
          signerPrivKey:
          '879aff43df53606d8ae1219d9347360e7a30d1c2f141e14c9bc96bb29bf930cb'
        }
      },
      operations: {}
    })
    jest.spyOn(DateTime, 'utc').mockImplementation(() => now)
    jest.clearAllMocks()
  })

  describe('handles actions', () => {
    it(' - setMessage', () => {
      const msg = 'this is a test message'
      const id = 1
      store.dispatch(actions.setChannelId(id))
      store.dispatch(actions.setMessage({ value: msg, id }))
      const result = channelSelectors.message(store.getState())
      expect(result).toEqual(msg)
    })

    it('- setLoading', () => {
      store.dispatch(actions.setLoading({ loading: false }))
      const channel = channelSelectors.channel(store.getState())
      expect(channel).toMatchSnapshot()
    })

    it('- setLoadingMessage', () => {
      store.dispatch(actions.setLoading({ message: 'this is a loading message' }))
      const channel = channelSelectors.channel(store.getState())
      expect(channel).toMatchSnapshot()
    })

    it('- setShareableUri', () => {
      store.dispatch(actions.setShareableUri('zbay://channel/this-is-a-hash'))
      const channel = channelSelectors.channel(store.getState())
      expect(channel).toMatchSnapshot()
    })
  })
})
