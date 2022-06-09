import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { getFactory } from '../../..'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { publicChannelsActions } from './../publicChannels.slice'
import { usersActions } from '../../users/users.slice'
import { identityActions } from '../../identity/identity.slice'
import { Identity } from '../../identity/identity.types'
import { FactoryGirl } from 'factory-girl'
import { expectSaga } from 'redux-saga-test-plan'
import { PublicChannel } from '../publicChannels.types'
import { communitiesActions, Community } from '../../communities/communities.slice'
import { sendNewUserInfoMessageSaga } from './sendNewUserInfoMessage.saga'
import { messagesActions } from '../../messages/messages.slice'
import { combineReducers } from '@reduxjs/toolkit'
import { reducers } from '../../reducers'

import { MAIN_CHANNEL } from '../../../constants'

describe('sendInitialChannelMessageSaga', () => {
  let store: Store
  let factory: FactoryGirl
  let channel: PublicChannel
  let user: Identity

  beforeAll(async () => {
    setupCrypto()

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

    channel = (await factory.build<typeof publicChannelsActions.addChannel>('PublicChannel'))
      .payload.channel

    store.dispatch(usersActions.test_remove_user_certificate({ certificate: user.userCertificate }))

    const reducer = combineReducers(reducers)
    await expectSaga(
      sendNewUserInfoMessageSaga,
      publicChannelsActions.sendNewUserInfoMessage({ certificates: [user.userCertificate] })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        messagesActions.sendMessage({
          message: `${user.nickname} Joined`,
          channelAddress: MAIN_CHANNEL
        })
      )
      .run()
  })
  test('dont send new user info message if not new user', async () => {
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
      publicChannelsActions.sendNewUserInfoMessage({ certificates: [user.userCertificate] })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(
        messagesActions.sendMessage({
          message: `${user.nickname} Joined`,
          channelAddress: MAIN_CHANNEL
        })
      )
      .run()
  })
})
