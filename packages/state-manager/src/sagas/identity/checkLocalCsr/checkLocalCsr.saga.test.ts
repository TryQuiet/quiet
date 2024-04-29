import { createUserCsr, getPubKey, loadPrivateKey, pubKeyFromCsr, setupCrypto } from '@quiet/identity'
import { FactoryGirl } from 'factory-girl'
import { getFactory } from '../../../utils/tests/factories'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { Store, combineReducers } from 'redux'
import { communitiesActions } from '../../communities/communities.slice'
import { identityActions } from '../identity.slice'
import { checkLocalCsrSaga } from './checkLocalCsr.saga'
import { CreateUserCsrPayload, SendCsrsResponse } from '@quiet/types'
import { expectSaga } from 'redux-saga-test-plan'
import { usersActions } from '../../users/users.slice'

describe('checkLocalCsr', () => {
  let store: Store
  let factory: FactoryGirl

  beforeEach(async () => {
    setupCrypto()
    store = prepareStore().store
    factory = await getFactory(store)
  })

  test('saves user csr if absent from the database', async () => {
    const community =
      await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    const identity = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'john',
    })

    const payload: SendCsrsResponse = {
      csrs: [],
    }

    const reducer = combineReducers(reducers)
    await expectSaga(checkLocalCsrSaga, usersActions.storeCsrs(payload))
      .withReducer(reducer)
      .withState(store.getState())
      .put(identityActions.saveUserCsr())
      .run()
  })

  test('saves user csr if local and stored one differs', async () => {
    const community =
      await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    const identity = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'john',
    })

    const _pubKey = pubKeyFromCsr(identity.userCsr!.userCsr)

    const privateKey = await loadPrivateKey(identity.userCsr!.userKey, 'ECDSA')
    const publicKey = await getPubKey(_pubKey)

    const existingKeyPair: CryptoKeyPair = { privateKey, publicKey }

    const createUserCsrPayload: CreateUserCsrPayload = {
      nickname: 'alice',
      commonName: identity.hiddenService.onionAddress,
      peerId: identity.peerId.id,
      dmPublicKey: identity.dmKeys.publicKey,
      signAlg: 'ECDSA',
      hashAlg: 'sha-256',
      existingKeyPair,
    }

    const csr = await createUserCsr(createUserCsrPayload)

    const payload: SendCsrsResponse = {
      csrs: [csr.userCsr],
    }

    const reducer = combineReducers(reducers)
    await expectSaga(checkLocalCsrSaga, usersActions.storeCsrs(payload))
      .withReducer(reducer)
      .withState(store.getState())
      .put(identityActions.saveUserCsr())
      .run()
  })

  test('skips if stored csr equals local one', async () => {
    const community =
      await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    const identity = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'john',
    })

    const payload: SendCsrsResponse = {
      csrs: [identity.userCsr!.userCsr],
    }

    const reducer = combineReducers(reducers)
    await expectSaga(checkLocalCsrSaga, usersActions.storeCsrs(payload))
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(identityActions.saveUserCsr())
      .run()
  })
})
