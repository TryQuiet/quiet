import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { type Socket } from '../../../types'
import { communitiesReducer, type communitiesActions } from '../../communities/communities.slice'
import { StoreKeys } from '../../store.keys'
import { identityReducer, type identityActions } from '../identity.slice'
import { saveUserCsrSaga } from './saveUserCsr.saga'
import { type Store } from '../../store.types'
import { type FactoryGirl } from 'factory-girl'
import { pubKeyFromCsr, setupCrypto, createUserCertificateTestHelper } from '@quiet/identity'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../../utils/tests/factories'
import { SocketActionTypes } from '@quiet/types'
import { usersReducer } from '../../users/users.slice'

describe('saveUserCsr', () => {
  let store: Store
  let factory: FactoryGirl

  beforeEach(async () => {
    setupCrypto()
    store = prepareStore().store
    factory = await getFactory(store)
  })

  test('saves user csr if user csr is absent in csrs list', async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

    const community =
      await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    const csr = (
      await createUserCertificateTestHelper(
        {
          nickname: 'john',
          commonName: 'commonName',
          peerId: 'peerId',
          dmPublicKey: 'dmPublicKey',
        },
        community.CA
      )
    ).userCsr

    const identity = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'john',
      userCsr: csr,
    })

    const reducer = combineReducers({
      [StoreKeys.Communities]: communitiesReducer,
      [StoreKeys.Identity]: identityReducer,
      [StoreKeys.Users]: usersReducer,
    })

    await expectSaga(saveUserCsrSaga, socket)
      .withReducer(reducer)
      .withState(store.getState())
      .call(pubKeyFromCsr, identity.userCsr?.userCsr)
      .apply(socket, socket.emit, [
        SocketActionTypes.SAVE_USER_CSR,
        {
          csr: identity.userCsr?.userCsr,
        },
      ])
      .run()
  })
  test("do not save user csr if it's already included in csrs list", async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

    const community =
      await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    const identity = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'john',
    })

    const reducer = combineReducers({
      [StoreKeys.Communities]: communitiesReducer,
      [StoreKeys.Identity]: identityReducer,
      [StoreKeys.Users]: usersReducer,
    })

    await expectSaga(saveUserCsrSaga, socket)
      .withReducer(reducer)
      .withState(store.getState())
      .call(pubKeyFromCsr, identity.userCsr?.userCsr)
      .not.apply(socket, socket.emit, [
        SocketActionTypes.SAVE_USER_CSR,
        {
          csr: identity.userCsr?.userCsr,
        },
      ])
      .run()
  })
})
