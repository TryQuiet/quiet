import { expectSaga } from 'redux-saga-test-plan'
import { Blob } from 'buffer'
import { type FactoryGirl } from 'factory-girl'

import { getReduxStoreFactory } from '../../..'
import { type Store } from '../../store.types'
import { saveUserProfileSaga } from './saveUserProfile.saga'
import { usersActions } from '../users.slice'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { type Socket } from '../../../types'
import { type Identity, SocketActions, UserProfile } from '@quiet/types'
import { MockedSocket } from '../../../utils/tests/mockedSocket'
import { getBaseTypesFactory, getSocketFactory } from '../../../utils/tests/factories'
import { fileToBase64String } from '@quiet/common'
import { combineReducers } from 'redux'
import { createLogger } from '../../../utils/logger'

const PHOTO_B64 = 'dGVzdAo='

jest.mock('@quiet/common', () => ({
  ...jest.requireActual('@quiet/common'),
  fileToBase64String: jest.fn(() => Promise.resolve(PHOTO_B64)),
}))

describe('saveUserProfileSaga', () => {
  let store: Store
  let reduxFactory: FactoryGirl
  let baseTypesFactory: FactoryGirl
  let socket: MockedSocket
  let identity: Identity
  let userProfile: UserProfile

  beforeEach(async () => {
    const socketPayloadFactory = await getSocketFactory()
    socket = new MockedSocket()
    store = prepareStore().store
    reduxFactory = await getReduxStoreFactory(store)
    baseTypesFactory = await getBaseTypesFactory()
    identity = await reduxFactory.create('Identity')
    userProfile = await baseTypesFactory.build('UserProfile', {
      userId: identity.userId,
    })
  })

  test('sends user profile without photo to backend', async () => {
    const logger = createLogger('saveUserProfileSaga-test1')
    delete userProfile.photo
    logger.info('userProfile', userProfile)
    // We are testing browser-targeting code in NodeJS and this
    // version of NodeJS doesn't have a File class, so we are using a
    // Blob instead.
    await expectSaga(
      saveUserProfileSaga,
      socket as unknown as Socket,
      // @ts-ignore
      usersActions.saveUserProfile({ photo: undefined, nickname: userProfile.nickname, bio: userProfile.bio })
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .not.call(fileToBase64String, expect.any(Blob))
      .put(usersActions.setUserProfile(userProfile))
      .apply(socket, socket.emit, [SocketActions.SET_USER_PROFILE, { profile: userProfile }])
      .run()
  })

  test('sends user profile with photo to backend', async () => {
    const logger = createLogger('saveUserProfileSaga-test2')
    logger.info('userProfile', userProfile)

    // We are testing browser-targeting code in NodeJS and this
    // version of NodeJS doesn't have a File class, so we are using a
    // Blob instead.
    await expectSaga(
      saveUserProfileSaga,
      socket as unknown as Socket,
      // @ts-ignore
      usersActions.saveUserProfile({ photo: new Blob([]), nickname: userProfile.nickname, bio: userProfile.bio })
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .put(usersActions.setUserProfile(userProfile))
      .apply(socket, socket.emit, [SocketActions.SET_USER_PROFILE, { profile: userProfile }])
      .run()
  })
})
