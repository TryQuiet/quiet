import { combineReducers } from 'redux'
import { expectSaga, testSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import { delay } from 'typed-redux-saga'
import { communitiesAdapter } from '../../communities/communities.adapter'
import {
  communitiesReducer,
  CommunitiesState,
  Community
} from '../../communities/communities.slice'
import { identityAdapter } from '../../identity/identity.adapter'
import { identityActions, identityReducer, IdentityState } from '../../identity/identity.slice'
import { Identity } from '../../identity/identity.types'
import { StoreKeys } from '../../store.keys'
import { errorsActions } from '../errors.slice'
import { ErrorCodes, ErrorMessages, ErrorTypes } from '../errors.types'
import { handleErrorsSaga } from './handleErrors.saga'

describe('handle errors', () => {
  const community: Community = {
    name: '',
    id: 'id',
    registrarUrl: 'registrarUrl',
    CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
    rootCa: '',
    peerList: [],
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

  test('receiving registrar server error results in retrying registration and not putting error in store', async () => {
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
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer
        }),
        {
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
      .provide([[call.fn(delay), null]])
      .put(
        identityActions.registerCertificate({
          communityId: community.id,
          nickname: identity.nickname,
          userCsr: identity.userCsr
        })
      )
      .not
      .put(errorsActions.addError(errorPayload))
      .run()
  })

  test('taken username error does not trigger re-registration and puts error into store', async () => {
    const errorPayload = {
      type: ErrorTypes.REGISTRAR,
      code: ErrorCodes.FORBIDDEN,
      message: ErrorMessages.USERNAME_TAKEN,
      community: community.id
    }
    await expectSaga(
      handleErrorsSaga,
      errorsActions.handleError(errorPayload)
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer
        }),
        {
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
      .provide([[call.fn(delay), null]])
      .not
      .put(
        identityActions.registerCertificate({
          communityId: community.id,
          nickname: identity.nickname,
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
