import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { communitiesAdapter } from '../../communities/communities.adapter'
import {
  communitiesReducer,
  CommunitiesState,
  Community
} from '../../communities/communities.slice'
import { errorsAdapter } from '../../errors/errors.adapter'
import { errorsReducer, ErrorsState } from '../../errors/errors.slice'
import { ErrorCodes, ErrorMessages } from '../../errors/errors.types'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { StoreKeys } from '../../store.keys'
import { config } from '../../users/const/certFieldTypes'
import { identityAdapter } from '../identity.adapter'
import {
  identityActions,
  identityReducer,
  IdentityState
} from '../identity.slice'
import { Identity } from '../identity.types'
import { registerUsernameSaga } from './registerUsername.saga'

describe('registerUsernameSaga', () => {
  const identity: Identity = {
    id: 'id',
    hiddenService: {
      onionAddress: 'onionAddress.onion',
      privateKey: 'privateKey'
    },
    dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
    peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
    nickname: '',
    userCsr: undefined,
    userCertificate: ''
  }

  const identityWithoutPeerId: Identity = {
    id: 'id',
    hiddenService: {
      onionAddress: 'onionAddress.onion',
      privateKey: 'privateKey'
    },
    dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
    peerId: { id: '', pubKey: 'pubKey', privKey: 'privKey' },
    nickname: '',
    userCsr: undefined,
    userCertificate: ''
  }

  const community: Community = {
    name: '',
    id: 'id',
    registrarUrl: 'registrarUrl',
    CA: null,
    rootCa: '',
    peerList: [],
    registrar: null,
    onionAddress: '',
    privateKey: '',
    port: 0
  }

  const connectionError = {
    community: 'id',
    type: SocketActionTypes.REGISTRAR,
    message: ErrorMessages.NOT_CONNECTED
  }

  const username = 'username'

  test('create user csr', async () =>
    await expectSaga(registerUsernameSaga, identityActions.registerUsername(username))
      .withReducer(
        combineReducers({
          [StoreKeys.Identity]: identityReducer,
          [StoreKeys.Communities]: communitiesReducer
        }),
        {
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            identities: identityAdapter.setAll(
              identityAdapter.getInitialState(),
              [identity]
            )
          },
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id',
            communities: communitiesAdapter.setAll(
              communitiesAdapter.getInitialState(),
              [community]
            )
          }
        }
      )
      .put(
        identityActions.updateUsername({
          communityId: identity.id,
          nickname: username
        })
      )
      .put(
        identityActions.createUserCsr({
          nickname: username,
          commonName: 'onionAddress.onion',
          peerId: 'peerId',
          dmPublicKey: 'publicKey',
          signAlg: config.signAlg,
          hashAlg: config.hashAlg
        })
      )
      .run())
  test('throw error if missing data', async () =>
    await expectSaga(
      registerUsernameSaga,
      identityActions.registerUsername('username')
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Identity]: identityReducer,
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Errors]: errorsReducer
        }),
        {
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            identities: identityAdapter.setAll(
              identityAdapter.getInitialState(),
              [identityWithoutPeerId]
            )
          },
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id',
            communities: communitiesAdapter.setAll(
              communitiesAdapter.getInitialState(),
              [community]
            )
          },
          [StoreKeys.Errors]: {
            ...new ErrorsState()
          }
        }
      )
      .hasFinalState({
        [StoreKeys.Identity]: {
          ...new IdentityState(),
          identities: identityAdapter.setAll(
            identityAdapter.getInitialState(),
            [identityWithoutPeerId]
          )
        },
        [StoreKeys.Communities]: {
          ...new CommunitiesState(),
          currentCommunity: 'id',
          communities: communitiesAdapter.setAll(
            communitiesAdapter.getInitialState(),
            [community]
          )
        },
        [StoreKeys.Errors]: {
          ...new ErrorsState(),
          errors: errorsAdapter.setAll(
            errorsAdapter.getInitialState(),
            [connectionError]
          )
        }
      })
      .run())
})
