import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { messages, publicChannels } from '../../..'
import { type FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { reducers } from '../../reducers'
import { expectSaga } from 'redux-saga-test-plan'
import { publicChannelsActions } from '../publicChannels.slice'
import { identityActions } from '../../identity/identity.slice'
import { type communitiesActions } from '../../communities/communities.slice'
import { DateTime } from 'luxon'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { messagesActions } from '../../messages/messages.slice'
import {
  ChannelsReplicatedPayload,
  ChannelType,
  UserProfile,
  type Community,
  type Identity,
  type PublicChannel,
} from '@quiet/types'
import { generateChannelId, generateDmChannelId } from '@quiet/common'
import { createLogger } from '../../../utils/logger'
import { getBaseTypesFactory, getReduxStoreFactory } from '../../../utils/tests/factories'
import { syncChannelDisplayNamesSaga } from './syncChannelDisplayNames.saga'

const logger = createLogger('syncChannelDisplayNames:test')

describe('syncChannelDisplayNamesSaga', () => {
  let store: Store
  let factory: FactoryGirl
  let baseTypes: FactoryGirl

  let community: Community
  let alice: UserProfile
  let john: UserProfile
  let sue: UserProfile

  let generalChannel: PublicChannel

  let sailingChannel: PublicChannel
  let photoChannel: PublicChannel

  let dmChannel: PublicChannel
  let selfDmChannel: PublicChannel
  let dmGroupChannel: PublicChannel

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store
    factory = await getReduxStoreFactory(store)
    baseTypes = await getBaseTypesFactory()

    community = await factory.create('Community')

    alice = await factory.create('UserProfile', {
      nickname: 'alice',
    })

    john = await factory.create('UserProfile', {
      nickname: 'john',
    })

    sue = await factory.create('UserProfile', {
      nickname: 'sue',
    })

    const aliceIdentity = await factory.create('Identity', {
      userId: alice.userId,
      communityId: community.id,
    })

    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()

    store.dispatch(publicChannelsActions.setCurrentChannel({ channelId: generalChannel.id }))
    sailingChannel = (
      await factory.create('PublicChannel', {
        communityId: community.id,
        channel: {
          name: 'sailing',
          description: 'Welcome to #sailing',
          timestamp: DateTime.utc().valueOf(),
          owner: 'owner',
          id: generateChannelId('sailing'),
          type: ChannelType.CHANNEL,
        },
        displayedName: 'sailing',
      })
    ).channel

    photoChannel = (
      await factory.create('PublicChannel', {
        communityId: community.id,
        channel: {
          name: 'photo',
          description: 'Welcome to #photo',
          timestamp: DateTime.utc().valueOf(),
          owner: 'owner',
          id: generateChannelId('photo'),
          type: ChannelType.CHANNEL,
        },
      })
    ).channel

    dmChannel = (
      await factory.create('PublicChannel', {
        communityId: community.id,
        channel: {
          name: 'dm-channel',
          description: '',
          timestamp: DateTime.utc().valueOf(),
          owner: alice.userId,
          id: generateDmChannelId([alice.userId, john.userId]),
          type: ChannelType.DM,
          memberIds: [alice.userId, john.userId],
        },
      })
    ).channel

    selfDmChannel = (
      await factory.create('PublicChannel', {
        communityId: community.id,
        channel: {
          name: 'self-dm-channel',
          description: '',
          timestamp: DateTime.utc().valueOf(),
          owner: 'owner',
          id: generateDmChannelId([alice.userId]),
          type: ChannelType.DM,
          memberIds: [alice.userId],
        },
      })
    ).channel

    dmGroupChannel = (
      await factory.create('PublicChannel', {
        communityId: community.id,
        channel: {
          name: 'group-dm-channel',
          description: '',
          timestamp: DateTime.utc().valueOf(),
          owner: alice.userId,
          id: generateDmChannelId([alice.userId, john.userId, sue.userId]),
          type: ChannelType.DM,
          memberIds: [alice.userId, john.userId, sue.userId],
        },
      })
    ).channel
  })

  it('syncs only updated displayed names', async () => {
    const reducer = combineReducers(testReducers)
    await expectSaga(syncChannelDisplayNamesSaga)
      .withReducer(reducer)
      .withState(store.getState())
      .not.putResolve(
        publicChannelsActions.setDisplayedName({
          channelId: sailingChannel.id,
          displayedName: sailingChannel.name,
        })
      )
      .putResolve(
        publicChannelsActions.setDisplayedName({
          channelId: photoChannel.id,
          displayedName: photoChannel.name,
        })
      )
      .putResolve(
        publicChannelsActions.setDisplayedName({
          channelId: selfDmChannel.id,
          displayedName: alice.nickname,
        })
      )
      .putResolve(
        publicChannelsActions.setDisplayedName({
          channelId: dmChannel.id,
          displayedName: john.nickname,
        })
      )
      .putResolve(
        publicChannelsActions.setDisplayedName({
          channelId: dmGroupChannel.id,
          displayedName: `${john.nickname}, ${sue.nickname}`,
        })
      )
      .run()
  })
})
