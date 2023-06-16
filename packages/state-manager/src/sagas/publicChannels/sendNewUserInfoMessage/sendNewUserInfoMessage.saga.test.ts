import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { getFactory } from '../../..'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { publicChannelsActions } from './../publicChannels.slice'
import { usersActions } from '../../users/users.slice'
import { type identityActions } from '../../identity/identity.slice'
import { type FactoryGirl } from 'factory-girl'
import { expectSaga } from 'redux-saga-test-plan'
import { type communitiesActions } from '../../communities/communities.slice'
import { sendNewUserInfoMessageSaga } from './sendNewUserInfoMessage.saga'
import { messagesActions } from '../../messages/messages.slice'
import { combineReducers } from '@reduxjs/toolkit'
import { reducers } from '../../reducers'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { capitalizeFirstLetter } from '@quiet/common'
import { type Identity, type PublicChannel } from '@quiet/types'

describe('sendInitialChannelMessageSaga', () => {
  let store: Store
  let factory: FactoryGirl
  let channel: PublicChannel
  let user: Identity
  let user2: Identity
  let generalChannel: PublicChannel

  beforeAll(async () => {
    setupCrypto()
  })

  beforeEach(async () => {
    store = prepareStore().store
    factory = await getFactory(store)
  })

  test('send new user info message', async () => {
    const community1 = await factory.create<
      ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')
    user = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      {
        id: community1.id
      }
    )

    user2 = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      {
        id: community1.id
      }
    )

    channel = (await factory.build<typeof publicChannelsActions.addChannel>('PublicChannel'))
      .payload.channel
    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()

    expect(user2.userCertificate).not.toBeNull()
    store.dispatch(
      // @ts-expect-error
      usersActions.test_remove_user_certificate({ certificate: user2.userCertificate })
    )

    expect(community1.name).not.toBeNull()
    const communityName = capitalizeFirstLetter(community1.name || '')

    const reducer = combineReducers(reducers)
    await expectSaga(
      sendNewUserInfoMessageSaga,
      // @ts-expect-error
      publicChannelsActions.sendNewUserInfoMessage({ certificates: [user2.userCertificate] })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        messagesActions.sendMessage({
          type: 3,
          message: `@${user2.nickname} has joined ${communityName}! 🎉`,
          channelId: generalChannel.id
        })
      )
      .run()
  })

  test('dont send new user info if user exists', async () => {
    const community1 = await factory.create<
      ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')
    user = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      {
        id: community1.id
      }
    )

    user2 = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      {
        id: community1.id
      }
    )

    channel = (await factory.build<typeof publicChannelsActions.addChannel>('PublicChannel'))
      .payload.channel

    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()

    expect(community1.name).not.toBeNull()
    const communityName = capitalizeFirstLetter(community1.name || '')
    expect(user2.userCertificate).not.toBeNull()
    const reducer = combineReducers(reducers)
    await expectSaga(
      sendNewUserInfoMessageSaga,
      // @ts-expect-error
      publicChannelsActions.sendNewUserInfoMessage({ certificates: [user2.userCertificate] })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(
        messagesActions.sendMessage({
          type: 3,
          message: `@${user2.nickname} has joined ${communityName}! 🎉`,
          channelId: generalChannel.id
        })
      )
      .run()
  })

  test('dont send new user info message if owner', async () => {
    const community1 = await factory.create<
      ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')
    user = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      {
        id: community1.id
      }
    )

    channel = (await factory.build<typeof publicChannelsActions.addChannel>('PublicChannel'))
      .payload.channel

    const reducer = combineReducers(reducers)
    await expectSaga(
      sendNewUserInfoMessageSaga,
      // @ts-expect-error
      publicChannelsActions.sendNewUserInfoMessage({ certificates: [user.userCertificate] })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(
        messagesActions.sendMessage({
          type: 3,
          message: `@${user2} has joined ${community1.name}! 🎉`,
          channelId: generalChannel.id
        })
      )
      .run()
  })

  test('remove possible duplicates before sending info message', async () => {
    const community1 = await factory.create<
      ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')
    user = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      {
        id: community1.id
      }
    )

    user2 = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      {
        id: community1.id
      }
    )

    channel = (await factory.build<typeof publicChannelsActions.addChannel>('PublicChannel'))
      .payload.channel

    store.dispatch(
      // @ts-expect-error
      usersActions.test_remove_user_certificate({ certificate: user2.userCertificate })
    )
    expect(community1.name).not.toBeNull()
    const communityName = capitalizeFirstLetter(community1.name || '')
    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()
    const reducer = combineReducers(reducers)
    const result = await expectSaga(
      sendNewUserInfoMessageSaga,
      publicChannelsActions.sendNewUserInfoMessage({
        // @ts-expect-error
        certificates: [user2.userCertificate, user2.userCertificate]
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        messagesActions.sendMessage({
          type: 3,
          message: `@${user2.nickname} has joined ${communityName}! 🎉`,
          channelId: generalChannel.id
        })
      )
      .run()

    expect(result.effects.put).toEqual(undefined) // Confirm there were no extra PUT effects
  })
})
