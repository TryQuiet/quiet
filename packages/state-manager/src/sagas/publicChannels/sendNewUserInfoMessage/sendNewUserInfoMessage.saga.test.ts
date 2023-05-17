import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { getFactory } from '../../..'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { publicChannelsActions } from './../publicChannels.slice'
import { usersActions } from '../../users/users.slice'
import { identityActions } from '../../identity/identity.slice'
import { FactoryGirl } from 'factory-girl'
import { expectSaga } from 'redux-saga-test-plan'
import { communitiesActions } from '../../communities/communities.slice'
import { sendNewUserInfoMessageSaga } from './sendNewUserInfoMessage.saga'
import { messagesActions } from '../../messages/messages.slice'
import { combineReducers } from '@reduxjs/toolkit'
import { reducers } from '../../reducers'

import { MAIN_CHANNEL } from '../../../constants'
import { capitalizeFirstLetter } from '@quiet/common'
import { Identity, PublicChannel } from '@quiet/types'

describe('sendInitialChannelMessageSaga', () => {
  let store: Store
  let factory: FactoryGirl
  let channel: PublicChannel
  let user: Identity
  let user2: Identity

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
          channelAddress: MAIN_CHANNEL
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
          channelAddress: MAIN_CHANNEL
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
          channelAddress: MAIN_CHANNEL
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
          channelAddress: MAIN_CHANNEL
        })
      )
      .run()

    expect(result.effects.put).toEqual(undefined) // Confirm there were no extra PUT effects
  })
})
