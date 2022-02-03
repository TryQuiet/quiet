import { combineReducers } from '@reduxjs/toolkit'
import { createUserCsr } from '@quiet/identity'
import { KeyObject } from 'crypto'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import {
  communitiesReducer,
  CommunitiesState,
  Community
} from '../../communities/communities.slice'
import { StoreKeys } from '../../store.keys'
import { identityAdapter } from '../identity.adapter'
import {
  identityActions,
  identityReducer,
  IdentityState
} from '../identity.slice'
import { CreateUserCsrPayload, Identity } from '../identity.types'
import { createUserCsrSaga } from './createUserCsr.saga'

describe('createUserCsrSaga', () => {
  const userCsr = {
    userCsr: 'userCsr',
    userKey: 'userKey',
    pkcs10: {
      publicKey: jest.fn() as unknown as KeyObject,
      privateKey: jest.fn() as unknown as KeyObject,
      pkcs10: 'pkcs10'
    }
  }

  test('create csr', async () => {
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
    const identity: Identity = {
      id: 'id',
      nickname: '',
      hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
      dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
      peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
      userCsr: undefined,
      userCertificate: null
    }
    const identityWithCsr: Identity = {
      id: 'id',
      nickname: '',
      hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
      dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
      peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
      userCsr: userCsr,
      userCertificate: null
    }
    const createUserCsrPayload: CreateUserCsrPayload = {
      nickname: '',
      commonName: '',
      peerId: '',
      dmPublicKey: '',
      signAlg: '',
      hashAlg: ''
    }
    await expectSaga(
      createUserCsrSaga,
      identityActions.createUserCsr(createUserCsrPayload)
    )
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
            communities: {
              ids: ['id'],
              entities: {
                [community.id]: community
              }
            }
          }
        }
      )
      .provide([[call.fn(createUserCsr), userCsr]])
      .hasFinalState({
        [StoreKeys.Identity]: {
          ...new IdentityState(),
          identities: identityAdapter.setAll(
            identityAdapter.getInitialState(),
            [identityWithCsr]
          )
        },
        [StoreKeys.Communities]: {
          ...new CommunitiesState(),
          currentCommunity: 'id',
          communities: {
            ids: ['id'],
            entities: {
              [community.id]: community
            }
          }
        }
      })
      .run()
  })
})
