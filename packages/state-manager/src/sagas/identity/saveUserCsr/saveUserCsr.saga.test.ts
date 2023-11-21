import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { type Socket } from '../../../types'
import { communitiesReducer, CommunitiesState, type communitiesActions } from '../../communities/communities.slice'
import { StoreKeys } from '../../store.keys'
import { identityAdapter } from '../identity.adapter'
import { identityReducer, IdentityState, type identityActions } from '../identity.slice'
import { saveUserCsrSaga } from './saveUserCsr.saga'
import { type Store } from '../../store.types'
import { type FactoryGirl } from 'factory-girl'
import { setupCrypto } from '@quiet/identity'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../../utils/tests/factories'
import { SocketActionTypes } from '@quiet/types'
import { usersReducer, UsersState } from '../../users/users.slice'
import { certificatesAdapter } from '../../users/users.adapter'

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

    const identity = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'john',
    })

    await expectSaga(saveUserCsrSaga, socket)
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer,
          [StoreKeys.Users]: usersReducer,
        }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: community.id,
            communities: {
              ids: [community.id],
              entities: {
                [community.id]: community,
              },
            },
          },
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            identities: identityAdapter.setAll(identityAdapter.getInitialState(), [identity]),
          },
          [StoreKeys.Users]: {
            ...new UsersState(),
          },
        }
      )
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

    console.log(identity.userCsr?.userCsr)

    await expectSaga(saveUserCsrSaga, socket)
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer,
          [StoreKeys.Users]: usersReducer,
        }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: community.id,
            communities: {
              ids: [community.id],
              entities: {
                [community.id]: community,
              },
            },
          },
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            identities: identityAdapter.setAll(identityAdapter.getInitialState(), [identity]),
          },
          [StoreKeys.Users]: {
            ...new UsersState(),
            csrs: certificatesAdapter.setAll(certificatesAdapter.getInitialState(), [identity.userCsr?.pkcs10.pkcs10]),
          },
        }
      )
      .not.apply(socket, socket.emit, [
        SocketActionTypes.SAVE_USER_CSR,
        {
          csr: identity.userCsr?.userCsr,
        },
      ])
      .run()
  })
})
