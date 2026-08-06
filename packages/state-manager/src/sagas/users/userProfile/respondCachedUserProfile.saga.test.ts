import { expectSaga } from 'redux-saga-test-plan'
import { type FactoryGirl } from 'factory-girl'
import { UserProfile } from '@quiet/types'
import { combineReducers } from 'redux'

import { usersActions } from '../users.slice'
import { respondCachedUserProfileSaga } from './respondCachedUserProfile.saga'
import { Store } from '../../store.types'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { getBaseTypesFactory } from '../../../utils/tests/factories'
import { userProfileSelectors } from './userProfile.selectors'

describe('respondCachedUserProfileSaga', () => {
  let store: Store
  let baseTypesFactory: FactoryGirl
  let userProfile: UserProfile
  let userId: string

  beforeEach(async () => {
    store = prepareStore().store
    baseTypesFactory = await getBaseTypesFactory()

    userProfile = await baseTypesFactory.create('UserProfile')
    userId = userProfile.userId
  })

  it('should return the cached profile for the requested user', async () => {
    const callback = jest.fn()

    await expectSaga(
      respondCachedUserProfileSaga,
      usersActions.cachedUserProfileRequested({
        userId,
        callback,
      })
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .provide([
        {
          select: ({ selector }: any, next: any) => {
            if (selector === userProfileSelectors.userProfiles) {
              return { [userId]: userProfile }
            }
            return next()
          },
        },
      ])
      .run()

    expect(callback).toHaveBeenCalledWith({ profile: userProfile })
  })

  it('should return an empty response when no cached profile exists', async () => {
    const callback = jest.fn()

    await expectSaga(
      respondCachedUserProfileSaga,
      usersActions.cachedUserProfileRequested({
        userId,
        callback,
      })
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .provide([
        {
          select: ({ selector }: any, next: any) => {
            if (selector === userProfileSelectors.userProfiles) {
              return {}
            }
            return next()
          },
        },
      ])
      .run()

    expect(callback).toHaveBeenCalledWith({})
  })
})
