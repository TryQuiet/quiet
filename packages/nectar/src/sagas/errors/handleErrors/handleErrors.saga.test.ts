import { combineReducers } from 'redux'
import { expectSaga, testSaga } from 'redux-saga-test-plan'
import { communitiesAdapter } from '../../communities/communities.adapter'
import {
  communitiesReducer, CommunitiesState, Community
} from '../../communities/communities.slice'
import { identityAdapter } from '../../identity/identity.adapter'
import {
  identityActions,
  identityReducer,
  IdentityState
} from '../../identity/identity.slice'
import { Identity } from '../../identity/identity.types'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { StoreKeys } from '../../store.keys'
import { errorsActions } from '../errors.slice'
import { ErrorCodes, ErrorMessages, GENERAL_ERRORS } from '../errors.types'
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

  test('receiving registrar server error results in retrying registration', async () => {
    await expectSaga(
      handleErrorsSaga,
      errorsActions.addError({
        type: SocketActionTypes.REGISTRAR,
        message: ErrorMessages.REGISTRATION_FAILED,
        communityId: community.id,
        code: ErrorCodes.SERVER_ERROR
      })
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer
        }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id-0',
            communities: communitiesAdapter.setAll(
              communitiesAdapter.getInitialState(),
              [community]
            )
          },
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            identities: identityAdapter.setAll(
              identityAdapter.getInitialState(),
              [identity]
            )
          }
        }
      )
      .put(
        identityActions.storeUserCsr({
          communityId: community.id,
          userCsr: identity.userCsr,
          registrarAddress: community.registrarUrl
        })
      )
      .run()
  })

  test('registrar validation error does not trigger re-registration', async () => {
    const addErrorAction = errorsActions.addError({
      type: SocketActionTypes.REGISTRAR,
      message: ErrorMessages.INVALID_USERNAME,
      communityId: community.id,
      code: ErrorCodes.VALIDATION
    })
    testSaga(handleErrorsSaga, addErrorAction)
      .next()
      .isDone()
  })

  test('general server error', async () => {
    const addErrorAction = errorsActions.addError({
      type: 'sockets',
      message: 'other error',
      communityId: GENERAL_ERRORS,
      code: ErrorCodes.SERVER_ERROR
    })
    testSaga(handleErrorsSaga, addErrorAction)
      .next()
      .isDone()
  })
})
