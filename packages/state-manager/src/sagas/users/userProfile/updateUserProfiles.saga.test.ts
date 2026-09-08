import { expectSaga } from 'redux-saga-test-plan'
import { type FactoryGirl } from 'factory-girl'
import { UserProfile, SocketActions } from '@quiet/types'

import { usersActions } from '../users.slice'
import { updateUserProfilesSaga } from './updateUserProfiles.saga'
import { MockedSocket } from '../../../utils/tests/mockedSocket'
import { Socket } from '../../../types'
import { Store } from '../../store.types'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { getBaseTypesFactory } from '../../../utils/tests/factories'
import { combineReducers } from 'redux'
import { userProfileSelectors } from './userProfile.selectors'

describe('updateUserProfilesSaga', () => {
  let store: Store
  let baseTypesFactory: FactoryGirl
  let socket: MockedSocket
  let userProfile: UserProfile
  let userId: string

  beforeEach(async () => {
    socket = new MockedSocket()
    store = prepareStore().store
    baseTypesFactory = await getBaseTypesFactory()

    userProfile = await baseTypesFactory.create('UserProfile')
    userId = userProfile.userId
  })

  it('should clear profilePhoto.path if CID changes', async () => {
    const newCid = 'new-cid'

    const existingProfiles = {
      [userId]: userProfile,
    }

    const updatedProfile: UserProfile = {
      ...userProfile,
      profilePhoto: {
        ...userProfile.profilePhoto!,
        cid: newCid,
        path: null,
      },
    }

    await expectSaga(
      updateUserProfilesSaga,
      socket as unknown as Socket,
      // @ts-ignore
      usersActions.updateUserProfiles([updatedProfile])
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .provide([
        {
          select: ({ selector }: any, next: any) => {
            if (selector === userProfileSelectors.userProfiles) {
              return existingProfiles
            }
            return next()
          },
        },
      ])
      .apply.like({
        context: socket,
        fn: socket.emit,
        args: [
          SocketActions.USER_PROFILES_UPDATED,
          {
            new: [],
            updates: [updatedProfile],
          },
        ],
      })
      .put.like({
        action: {
          type: usersActions.setUserProfiles.type,
          payload: [updatedProfile],
        },
      })
      .run()
  })

  it('should NOT clear profilePhoto.path if CID is the same', async () => {
    const existingProfiles = {
      [userId]: userProfile,
    }

    const updatedProfile: UserProfile = {
      ...userProfile,
      profilePhoto: {
        ...userProfile.profilePhoto!,
        path: null,
      },
    }

    await expectSaga(
      updateUserProfilesSaga,
      socket as unknown as Socket,
      // @ts-ignore
      usersActions.updateUserProfiles([updatedProfile])
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .provide([
        {
          select: ({ selector }: any, next: any) => {
            if (selector === userProfileSelectors.userProfiles) {
              return existingProfiles
            }
            return next()
          },
        },
      ])
      // since we aren't updating the profile we aren't sending the socket event to ios
      .not.apply.like({
        context: socket,
        fn: socket.emit,
      })
      .put.like({
        action: {
          type: usersActions.setUserProfiles.type,
          payload: [userProfile],
        },
      })
      .run()
  })

  it('should preserve profilePhoto.path and emit an update when CID is unchanged but other fields change', async () => {
    const existingProfiles = {
      [userId]: userProfile,
    }

    const updatedProfile: UserProfile = {
      ...userProfile,
      nickname: `${userProfile.nickname}-updated`,
      profilePhoto: {
        ...userProfile.profilePhoto!,
        path: null,
      },
    }

    const expectedProfile: UserProfile = {
      ...updatedProfile,
      profilePhoto: {
        ...updatedProfile.profilePhoto!,
        path: userProfile.profilePhoto!.path,
      },
    }

    await expectSaga(
      updateUserProfilesSaga,
      socket as unknown as Socket,
      usersActions.updateUserProfiles([updatedProfile])
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .provide([
        {
          select: ({ selector }: any, next: any) => {
            if (selector === userProfileSelectors.userProfiles) {
              return existingProfiles
            }
            return next()
          },
        },
      ])
      .apply.like({
        context: socket,
        fn: socket.emit,
        args: [
          SocketActions.USER_PROFILES_UPDATED,
          {
            new: [],
            updates: [expectedProfile],
          },
        ],
      })
      .put.like({
        action: {
          type: usersActions.setUserProfiles.type,
          payload: [expectedProfile],
        },
      })
      .run()
  })

  it('should send new profile via socket to ios', async () => {
    const existingProfiles = {
      [userId]: userProfile,
    }

    const newProfile = await baseTypesFactory.create('UserProfile')

    await expectSaga(
      updateUserProfilesSaga,
      socket as unknown as Socket,
      // @ts-ignore
      { payload: [userProfile, newProfile] }
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .provide([
        {
          select: ({ selector }: any, next: any) => {
            if (selector === userProfileSelectors.userProfiles) {
              return existingProfiles
            }
            return next()
          },
        },
      ])
      .apply.like({
        context: socket,
        fn: socket.emit,
        args: [
          SocketActions.USER_PROFILES_UPDATED,
          {
            new: [newProfile],
            updates: [],
          },
        ],
      })
      .put.like({
        action: {
          type: usersActions.setUserProfiles.type,
          payload: [userProfile, newProfile],
        },
      })
      .run()
  })

  it('should not write cached profiles to storage when a partial update does not include them', async () => {
    const existingProfiles = {
      [userId]: userProfile,
    }
    const remoteProfile = await baseTypesFactory.create<UserProfile>('UserProfile')

    await expectSaga(
      updateUserProfilesSaga,
      socket as unknown as Socket,
      usersActions.updateUserProfiles([remoteProfile])
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .provide([
        {
          select: ({ selector }: any, next: any) => {
            if (selector === userProfileSelectors.userProfiles) {
              return existingProfiles
            }
            return next()
          },
        },
      ])
      .not.call.like({
        context: socket,
        fn: socket.emitWithAck,
      })
      .put.like({
        action: {
          type: usersActions.setUserProfiles.type,
          payload: [userProfile, remoteProfile],
        },
      })
      .run()
  })
})
