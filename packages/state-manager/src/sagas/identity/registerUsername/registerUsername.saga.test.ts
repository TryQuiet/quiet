import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import { setupCrypto, createUserCsr, type UserCsr, getPubKey, loadPrivateKey, pubKeyFromCsr } from '@quiet/identity'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../../utils/tests/factories'
import { reducers } from '../../reducers'
import { identityActions } from '../identity.slice'
import { registerUsernameSaga } from './registerUsername.saga'
import { communitiesActions } from '../../communities/communities.slice'
import { config } from '../../users/const/certFieldTypes'
import { CertData, CreateUserCsrPayload, SocketActionTypes } from '@quiet/types'
import { Socket } from '../../../types'

describe('registerUsernameSaga', () => {
  it('create user csr', async () => {
    setupCrypto()

    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

    const store = prepareStore().store

    const factory = await getFactory(store)

    const community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>(
      'Community',
      {
        CA: null,
        rootCa: 'rootCertString',
        ownerOrbitDbIdentity: 'ownerOrbitDbId',
      }
    )

    // Identity won't have userCsr as long as its corresponding community has no CA (factory specific logic)
    const identity = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: undefined,
      userCsr: null,
    })

    const userCsr: UserCsr = {
      userCsr: 'userCsr',
      userKey: 'userKey',
      pkcs10: jest.fn() as unknown as CertData,
    }

    const createUserCsrPayload: CreateUserCsrPayload = {
      nickname: 'nickname',
      commonName: identity.hiddenService.onionAddress,
      peerId: identity.peerId.id,
      dmPublicKey: identity.dmKeys.publicKey,
      signAlg: config.signAlg,
      hashAlg: config.hashAlg,
    }

    const reducer = combineReducers(reducers)
    const psk = '12345'
    store.dispatch(communitiesActions.savePSK(psk))
    await expectSaga(registerUsernameSaga, socket, identityActions.registerUsername({ nickname: 'nickname' }))
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(createUserCsr), userCsr]])
      .apply(socket, socket.emit, [
        SocketActionTypes.CREATE_NETWORK,
        {
          id: community.id,
          name: community.name,
          registrarUrl: community.registrarUrl,
          CA: community.CA,
          rootCa: undefined,
          psk: psk,
          ownerOrbitDbIdentity: 'ownerOrbitDbId',
        },
      ])
      .dispatch(identityActions.addNewIdentity(identity))
      .call(createUserCsr, createUserCsrPayload)
      .put(
        identityActions.registerCertificate({
          communityId: community.id,
          nickname: 'nickname',
          userCsr,
          isUsernameTaken: false,
        })
      )
      .run()
  })

  it('username taken - use current CSR and new nickname', async () => {
    setupCrypto()
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

    const store = prepareStore().store

    const factory = await getFactory(store)

    const community =
      await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    const oldNickname = 'john'
    const newNickname = 'paul'

    const userCsr: UserCsr = {
      userCsr: 'userCsr',
      userKey: 'userKey',
      pkcs10: jest.fn() as unknown as CertData,
    }

    const identity = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      nickname: oldNickname,
      id: community.id,
      userCsr: userCsr,
    })

    if (!identity.userCsr?.userCsr) return
    const pubKey = 'pubKey'
    const privateKey = 'privateKey'
    const publicKey = 'publicKey'

    const createUserCsrPayload: CreateUserCsrPayload = {
      nickname: newNickname,
      commonName: identity.hiddenService.onionAddress,
      peerId: identity.peerId.id,
      dmPublicKey: identity.dmKeys.publicKey,
      signAlg: config.signAlg,
      hashAlg: config.hashAlg,
      existingKeyPair: {
        privateKey: privateKey as unknown as CryptoKey,
        publicKey: publicKey as unknown as CryptoKey,
      },
    }

    const reducer = combineReducers(reducers)
    await expectSaga(
      registerUsernameSaga,
      socket,
      identityActions.registerUsername({ nickname: newNickname, isUsernameTaken: true })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([
        [call.fn(pubKeyFromCsr), pubKey],
        [call.fn(loadPrivateKey), privateKey],
        [call.fn(getPubKey), publicKey],
        [call.fn(createUserCsr), userCsr],
      ])
      .call(pubKeyFromCsr, identity.userCsr.userCsr)
      .call(loadPrivateKey, identity.userCsr.userKey, config.signAlg)
      .call(getPubKey, pubKey)
      .call(createUserCsr, createUserCsrPayload)
      .put(
        identityActions.registerCertificate({
          communityId: community.id,
          nickname: newNickname,
          userCsr,
          isUsernameTaken: true,
        })
      )
      .run()
  })

  // Outdated
  it.skip("reuse existing csr if provided username hasn't changed", async () => {
    setupCrypto()

    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

    const store = prepareStore().store

    const factory = await getFactory(store)

    const community =
      await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    const userCsr: UserCsr = {
      userCsr: 'userCsr',
      userKey: 'userKey',
      pkcs10: jest.fn() as unknown as CertData,
    }

    const identity = (
      await factory.build<typeof identityActions.addNewIdentity>('Identity', {
        nickname: undefined,
        id: community.id,
      })
    ).payload

    identity.userCsr = userCsr

    store.dispatch(identityActions.addNewIdentity(identity))

    const reducer = combineReducers(reducers)
    await expectSaga(registerUsernameSaga, socket, identityActions.registerUsername({ nickname: identity.nickname }))
      .withReducer(reducer)
      .withState(store.getState())
      .not.call(createUserCsr)
      .apply(socket, socket.emit, [
        SocketActionTypes.CREATE_NETWORK,
        {
          id: community.id,
          name: community.name,
          registrarUrl: community.registrarUrl,
          CA: community.CA,
          rootCa: undefined,
        },
      ])
      .dispatch(identityActions.addNewIdentity(identity))
      .put(
        identityActions.registerCertificate({
          communityId: community.id,
          nickname: identity.nickname,
          userCsr,
        })
      )
      .run()
  })

  // Outdated
  it.skip("don't reuse existing csr if provided username has changed", async () => {
    setupCrypto()

    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

    const store = prepareStore().store

    const factory = await getFactory(store)

    const community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>(
      'Community',
      {
        id: '1',
        name: 'rockets',
        registrarUrl: 'registrarUrl',
        CA: null,
        rootCa: 'rootCa',
        peerList: [],
        registrar: null,
        onionAddress: '',
        privateKey: '',
        port: 0,
      }
    )

    const oldUserCsr: UserCsr = {
      userCsr: 'userCsr',
      userKey: 'userKey',
      pkcs10: jest.fn() as unknown as CertData,
    }

    const identity = (
      await factory.build<typeof identityActions.addNewIdentity>('Identity', {
        nickname: undefined,
        id: community.id,
      })
    ).payload

    identity.userCsr = oldUserCsr

    store.dispatch(identityActions.addNewIdentity(identity))

    const userCsr: UserCsr = {
      userCsr: 'userCsr',
      userKey: 'userKey',
      pkcs10: jest.fn() as unknown as CertData,
    }

    const createUserCsrPayload: CreateUserCsrPayload = {
      nickname: 'nickname',
      commonName: identity.hiddenService.onionAddress,
      peerId: identity.peerId.id,
      dmPublicKey: identity.dmKeys.publicKey,
      signAlg: config.signAlg,
      hashAlg: config.hashAlg,
    }

    const reducer = combineReducers(reducers)
    await expectSaga(
      registerUsernameSaga,
      socket,
      identityActions.registerUsername({
        nickname: 'nickname',
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(createUserCsr), userCsr]])
      .apply(socket, socket.emit, [
        SocketActionTypes.CREATE_NETWORK,
        {
          id: community.id,
          name: community.name,
          registrarUrl: community.registrarUrl,
          CA: community.CA,
          rootCa: undefined,
        },
      ])
      .dispatch(identityActions.addNewIdentity(identity))
      .call(createUserCsr, createUserCsrPayload)
      .put(
        identityActions.registerCertificate({
          communityId: community.id,
          nickname: 'nickname',
          userCsr,
        })
      )
      .run()
  })
})
