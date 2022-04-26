import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { StoreKeys } from '../../store.keys'
import {
  publicChannelsActions,
  publicChannelsReducer,
  PublicChannelsState
} from '../publicChannels.slice'
import { subscribeToAllTopicsSaga } from './subscribeToAllTopics.saga'
import {
  channelMessagesAdapter,
  communityChannelsAdapter,
  publicChannelsAdapter
} from '../publicChannels.adapter'
import {
  communitiesReducer,
  CommunitiesState,
  Community
} from '../../communities/communities.slice'
import { identityReducer, IdentityState } from '../../identity/identity.slice'
import { communitiesAdapter } from '../../communities/communities.adapter'
import { identityAdapter } from '../../identity/identity.adapter'
import { CommunityChannels, PublicChannelStorage } from '../publicChannels.types'
import { Identity } from '../../identity/identity.types'

describe('subscribeToAllTopicsSaga', () => {
  const community: Community = {
    name: '',
    id: 'id',
    CA: null,
    rootCa: '',
    peerList: [],
    registrarUrl: 'registrarUrl',
    registrar: null,
    onionAddress: '',
    privateKey: '',
    port: 0
  }

  const identity: Identity = {
    id: 'id',
    hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
    dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
    peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
    nickname: '',
    userCsr: undefined,
    userCertificate: ''
  }

  const channelOne: PublicChannelStorage = {
    name: 'channelOne',
    description: 'Welcome to #channelOne',
    owner: 'master',
    timestamp: 0,
    address: 'channelOne',
    messages: channelMessagesAdapter.getInitialState()
  }

  const channelTwo: PublicChannelStorage = {
    name: 'channelTwo',
    description: 'Welcome to #channelTwo',
    owner: 'master',
    timestamp: 0,
    address: 'channelTwo',
    messages: channelMessagesAdapter.getInitialState()
  }

  const communityChannels: CommunityChannels = {
    id: 'id',
    currentChannelAddress: 'channelOne',
    channels: publicChannelsAdapter.setAll(publicChannelsAdapter.getInitialState(), [
      channelOne,
      channelTwo
    ])
  }

  test('ask for missing messages', async () => {
    await expectSaga(subscribeToAllTopicsSaga)
      .withReducer(
        combineReducers({
          [StoreKeys.PublicChannels]: publicChannelsReducer,
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer
        }),
        {
          [StoreKeys.PublicChannels]: {
            ...new PublicChannelsState(),
            channels: communityChannelsAdapter.setAll(communityChannelsAdapter.getInitialState(), [
              communityChannels
            ])
          },
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id',
            communities: communitiesAdapter.setAll(communitiesAdapter.getInitialState(), [
              community
            ])
          },
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            identities: identityAdapter.setAll(identityAdapter.getInitialState(), [identity])
          }
        }
      )
      .put(
        publicChannelsActions.subscribeToTopic({
          channelData: channelOne,
          peerId: 'peerId'
        })
      )
      .put(
        publicChannelsActions.subscribeToTopic({
          channelData: channelTwo,
          peerId: 'peerId'
        })
      )
      .run()
  })
})
