import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
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
import { ErrorCodes, ErrorMessages } from '../errors.types'
import { handleErrorsSaga } from './handleErrors.saga'

describe('handle errors', () => {
  test('registrar error', async () => {
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
      zbayNickname: '',
      userCsr: undefined,
      userCertificate: ''
    }
    await expectSaga(
      handleErrorsSaga,
      errorsActions.addError({
        type: SocketActionTypes.REGISTRAR,
        message: ErrorMessages.REGISTRATION_FAILED,
        communityId: 'id',
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
      .put({ type: 'id.registrar.error' })
      .run()
  })
  test('general error', async () => {
    await expectSaga(
      handleErrorsSaga,
      errorsActions.addError({
        type: 'sockets',
        message: 'Registering username failed.',
        communityId: 'general',
        code: 500
      })
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer
        })
      )
      .put({ type: 'general.sockets.error' })
      .run()
  })
})
