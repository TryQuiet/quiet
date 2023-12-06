import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import { setupCrypto, createUserCsr, type UserCsr, getPubKey, loadPrivateKey, pubKeyFromCsr } from '@quiet/identity'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../../utils/tests/factories'
import { reducers } from '../../reducers'
import { identityActions } from '../identity.slice'
import { chooseUsernameSaga } from './chooseUsername.saga'
import { communitiesActions } from '../../communities/communities.slice'
import { config } from '../../users/const/certFieldTypes'
import { CertData, CreateUserCsrPayload } from '@quiet/types'
import { Store } from '../../store.types'
import { FactoryGirl } from 'factory-girl'

describe('chooseUsernameSaga', () => {

  let store: Store
  let factory: FactoryGirl

  beforeAll(async () => {
    setupCrypto()
  })

  beforeEach(async () => {
    store = prepareStore().store
    factory = await getFactory(store)
  })

  it('create user csr', async () => {
    const community = await factory.create<ReturnType<typeof communitiesActions.storeCommunity>['payload']>(
      'Community',
      {
        CA: null,
        rootCa: 'rootCertString',
      }
    )

    // Identity won't have userCsr as long as its corresponding community has no CA (factory specific logic)
    const identity = await factory.create<ReturnType<typeof identityActions.storeIdentity>['payload']>('Identity', {
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
      signAlg: config.signAlg,
      hashAlg: config.hashAlg,
      existingKeyPair: undefined
    }

    const psk = '12345'
    store.dispatch(communitiesActions.savePSK(psk))

    const reducer = combineReducers(reducers)

    await expectSaga(chooseUsernameSaga, identityActions.chooseUsername({ nickname: 'nickname' }))
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(createUserCsr), userCsr]])
      .call(createUserCsr, createUserCsrPayload)
      .run()
  })

  it('uuse current CSR and new nickname (username taken)', async () => {
    const community =
      await factory.create<ReturnType<typeof communitiesActions.storeCommunity>['payload']>('Community')

    const oldNickname = 'john'
    const newNickname = 'paul'

    const userCsr: UserCsr = {
      userCsr: 'userCsr',
      userKey: 'userKey',
      pkcs10: jest.fn() as unknown as CertData,
    }

    const identity = await factory.create<ReturnType<typeof identityActions.storeIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: oldNickname,
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
      signAlg: config.signAlg,
      hashAlg: config.hashAlg,
      existingKeyPair: {
        privateKey: privateKey as unknown as CryptoKey,
        publicKey: publicKey as unknown as CryptoKey,
      },
    }

    const reducer = combineReducers(reducers)
    await expectSaga(
      chooseUsernameSaga,
      identityActions.chooseUsername({ nickname: newNickname })
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
      .run()
  })
})
