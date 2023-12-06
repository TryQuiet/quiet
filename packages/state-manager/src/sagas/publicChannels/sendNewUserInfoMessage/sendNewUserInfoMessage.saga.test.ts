import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { communities, getFactory } from '../../..'
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
import { communitiesSelectors } from '../../communities/communities.selectors'

describe('sendInitialChannelMessageSaga', () => {
  let store: Store

  let factory: FactoryGirl

  beforeAll(async () => {
    setupCrypto()
  })

  beforeEach(async () => {
    store = prepareStore().store
    factory = await getFactory(store)
  })

  test('send new user info message', async () => {
    const community =
      await factory.create<ReturnType<typeof communitiesActions.storeCommunity>['payload']>('Community', {
        name: 'rockets',
      })

    const john = (await factory.build<typeof identityActions.storeIdentity>('Identity', {
      id: community.id,
      nickname: 'john',
    })).payload

    store.dispatch(
      // @ts-expect-error
      usersActions.test_remove_user_certificate({ certificate: john.userCertificate })
    )

    const generalChannel = publicChannelsSelectors.generalChannel(store.getState())

    const communityName = capitalizeFirstLetter(community.name || '')

    const reducer = combineReducers(reducers)
    await expectSaga(
      sendNewUserInfoMessageSaga,
      // @ts-expect-error
      publicChannelsActions.sendNewUserInfoMessage({ certificates: [john.userCertificate] })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        messagesActions.sendMessage({
          type: 3,
          message: `@${john.nickname} has joined ${communityName}! 🎉`,
          channelId: generalChannel?.id || 'general',
        })
      )
      .run()
  })

  test('dont send new user info if user exists', async () => {
    const community =
      await factory.create<ReturnType<typeof communitiesActions.storeCommunity>['payload']>('Community')

    const john = (await factory.build<typeof identityActions.storeIdentity>('Identity', {
      id: community.id,
    })).payload


    const generalChannel = publicChannelsSelectors.generalChannel(store.getState())

    const communityName = capitalizeFirstLetter(community.name || '')

    expect(john.userCertificate).not.toBeNull()

    const reducer = combineReducers(reducers)
    await expectSaga(
      sendNewUserInfoMessageSaga,
      // @ts-expect-error
      publicChannelsActions.sendNewUserInfoMessage({ certificates: [john.userCertificate] })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(
        messagesActions.sendMessage({
          type: 3,
          message: `@${john.nickname} has joined ${communityName}! 🎉`,
          channelId: generalChannel?.id || 'general',
        })
      )
      .run()
  })

  test('dont send new user info message if owner', async () => {
    // const community =
    //   await factory.create<ReturnType<typeof communitiesActions.storeCommunity>['payload']>('Community')

    const alice = await factory.create<ReturnType<typeof identityActions.storeIdentity>['payload']>('Identity', {
      id: 'community',
    })

    const community = communitiesSelectors.currentCommunity(store.getState())

    const generalChannel = publicChannelsSelectors.generalChannel(store.getState())

    const reducer = combineReducers(reducers)
    await expectSaga(
      sendNewUserInfoMessageSaga,
      // @ts-expect-error
      publicChannelsActions.sendNewUserInfoMessage({ certificates: [alice.userCertificate] })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(
        messagesActions.sendMessage({
          type: 3,
          message: `@${alice} has joined ${community.name}! 🎉`,
          channelId: generalChannel?.id || 'general',
        })
      )
      .run()
  })

  test('remove possible duplicates before sending info message', async () => {
    const community =
      await factory.create<ReturnType<typeof communitiesActions.storeCommunity>['payload']>('Community')

    const john = (await factory.build<typeof identityActions.storeIdentity>('Identity', {
      id: community.id,
      nickname: 'john'
    })).payload

    store.dispatch(
      // @ts-expect-error
      usersActions.test_remove_user_certificate({ certificate: john.userCertificate })
    )

    const generalChannel = publicChannelsSelectors.generalChannel(store.getState())

    const communityName = capitalizeFirstLetter(community.name || '')

    const reducer = combineReducers(reducers)
    const result = await expectSaga(
      sendNewUserInfoMessageSaga,
      publicChannelsActions.sendNewUserInfoMessage({
        // @ts-expect-error
        certificates: [john.userCertificate, john.userCertificate],
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        messagesActions.sendMessage({
          type: 3,
          message: `@${john.nickname} has joined ${communityName}! 🎉`,
          channelId: generalChannel?.id || 'general',
        })
      )
      .run()

    expect(result.effects.put).toEqual(undefined) // Confirm there were no extra PUT effects
  })
})
