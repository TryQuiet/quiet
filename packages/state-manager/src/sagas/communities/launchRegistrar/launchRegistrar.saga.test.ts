import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { Socket } from 'socket.io-client'
import { identityAdapter } from '../../identity/identity.adapter'
import { identityReducer, IdentityState } from '../../identity/identity.slice'
import { Identity } from '../../identity/identity.types'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { StoreKeys } from '../../store.keys'
import { communitiesAdapter } from '../communities.adapter'
import {
  communitiesActions,
  communitiesReducer, CommunitiesState, Community
} from '../communities.slice'
import { launchRegistrarSaga } from './launchRegistrar.saga'

describe('launchRegistrar', () => {
  test("launch certain registrar instead of current community's registrar", async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket
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
      port: 0,
      registrationAttempts: 0
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
    const launchRegistrarPayload = {
      id: 'id',
      peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
      hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
      privateKey: ''
    }
    await expectSaga(launchRegistrarSaga, socket, communitiesActions.launchCommunity(community.id))
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer
        }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id-0',
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
      .apply(socket, socket.emit, [
        SocketActionTypes.LAUNCH_REGISTRAR,
        {
          id: launchRegistrarPayload.id,
          peerId: launchRegistrarPayload.peerId.id,
          rootCertString: launchRegistrarPayload.CA.rootCertString,
          rootKeyString: launchRegistrarPayload.CA.rootKeyString,
          privateKey: launchRegistrarPayload.privateKey
        }
      ])
      .run()
  })
  test('do not attempt to launch certain registrar if user is not community owner', async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket
    const community: Community = {
      name: '',
      id: 'id',
      registrarUrl: 'registrarUrl',
      CA: undefined,
      rootCa: '',
      peerList: [],
      registrar: null,
      onionAddress: '',
      privateKey: '',
      port: 0,
      registrationAttempts: 0
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
    const launchRegistrarPayload = {
      id: 'id',
      peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
      hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
      privateKey: ''
    }
    await expectSaga(launchRegistrarSaga, socket, communitiesActions.launchCommunity(community.id))
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer
        }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id-0',
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
      .not.apply(socket, socket.emit, [
        SocketActionTypes.LAUNCH_REGISTRAR,
        {
          id: launchRegistrarPayload.id,
          peerId: launchRegistrarPayload.peerId.id,
          rootCertString: launchRegistrarPayload.CA.rootCertString,
          rootKeyString: launchRegistrarPayload.CA.rootKeyString,
          privateKey: launchRegistrarPayload.privateKey
        }
      ])
      .run()
  })
  test("launch registrar if user is current community's owner", async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket
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
      port: 0,
      registrationAttempts: 0
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
    const launchRegistrarPayload = {
      id: 'id',
      peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
      hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
      privateKey: ''
    }
    await expectSaga(launchRegistrarSaga, socket, communitiesActions.launchCommunity())
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
      .apply(socket, socket.emit, [
        SocketActionTypes.LAUNCH_REGISTRAR,
        {
          id: launchRegistrarPayload.id,
          peerId: launchRegistrarPayload.peerId.id,
          rootCertString: launchRegistrarPayload.CA.rootCertString,
          rootKeyString: launchRegistrarPayload.CA.rootKeyString,
          privateKey: launchRegistrarPayload.privateKey
        }
      ])
      .run()
  })
  test("do not attempt to launch registrar if user is not current community's owner", async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket
    const community: Community = {
      name: '',
      id: 'id',
      registrarUrl: 'registrarUrl',
      CA: undefined,
      rootCa: '',
      peerList: [],
      registrar: null,
      onionAddress: '',
      privateKey: '',
      port: 0,
      registrationAttempts: 0
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
    const launchRegistrarPayload = {
      id: 'id',
      peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
      hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
      privateKey: ''
    }
    await expectSaga(launchRegistrarSaga, socket, communitiesActions.launchCommunity())
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
      .not.apply(socket, socket.emit, [
        SocketActionTypes.LAUNCH_REGISTRAR,
        {
          id: launchRegistrarPayload.id,
          peerId: launchRegistrarPayload.peerId.id,
          rootCertString: launchRegistrarPayload.CA.rootCertString,
          rootKeyString: launchRegistrarPayload.CA.rootKeyString,
          privateKey: launchRegistrarPayload.privateKey
        }
      ])
      .run()
  })
})
