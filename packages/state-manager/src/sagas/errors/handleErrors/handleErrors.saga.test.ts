import { combineReducers } from 'redux'
import { expectSaga, testSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import { delay } from 'typed-redux-saga'
import { Store } from '@reduxjs/toolkit'
import { setupCrypto } from '@quiet/identity'
import {
  communitiesActions
} from '../../communities/communities.slice'
import { Community, ErrorCodes, ErrorMessages, ErrorTypes, Identity } from '@quiet/types'
import { identityActions } from '../../identity/identity.slice'
import { errorsActions } from '../errors.slice'
import { handleErrorsSaga, retryRegistration } from './handleErrors.saga'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../../utils/tests/factories'

describe('handle errors', () => {
  setupCrypto()

  let store: Store
  let community: Community
  let identity: Identity

  beforeEach(async () => {
    store = prepareStore({}).store
  })

  test('receiving registrar server error results in retrying registration', async () => {
    const factory = await getFactory(store)
    community = await factory.create<
    ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community', { registrationAttempts: 0 })
    identity = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'alice' }
    )

    const reducer = combineReducers(reducers)

    const errorPayload = {
      community: community.id,
      type: ErrorTypes.REGISTRAR,
      code: ErrorCodes.NOT_FOUND,
      message: ErrorMessages.REGISTRAR_NOT_FOUND
    }
    await expectSaga(
      handleErrorsSaga,
      errorsActions.handleError(errorPayload)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(delay), null]])
      .call(
        retryRegistration, community.id
      )
      .put(errorsActions.addError(errorPayload))
      .put(communitiesActions.updateRegistrationAttempts({ id: community.id, registrationAttempts: 1 }))
      .run()
  })

  test('taken username error does not trigger re-registration and puts error into store', async () => {
    const factory = await getFactory(store)
    community = await factory.create<
    ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')
    identity = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'alice' }
    )

    const reducer = combineReducers(reducers)

    const errorPayload = {
      type: ErrorTypes.REGISTRAR,
      code: ErrorCodes.FORBIDDEN,
      message: ErrorMessages.USERNAME_TAKEN,
      community: community.id
    }
    expect(identity.userCsr).not.toBeNull()
    await expectSaga(
      handleErrorsSaga,
      errorsActions.handleError(errorPayload)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(delay), null]])
      .not
      .put(
        identityActions.registerCertificate({
          communityId: community.id,
          nickname: identity.nickname,
          // @ts-expect-error
          userCsr: identity.userCsr
        })
      )
      .put(errorsActions.addError(errorPayload))
      .run()
  })

  test('Error other than registrar error adds error to store', async () => {
    const errorPayload = {
      type: ErrorTypes.OTHER,
      message: ErrorMessages.NETWORK_SETUP_FAILED,
      code: ErrorCodes.BAD_REQUEST
    }
    const addErrorAction = errorsActions.handleError(errorPayload)
    testSaga(handleErrorsSaga, addErrorAction).next().put(errorsActions.addError(errorPayload)).next().isDone()
  })
})
