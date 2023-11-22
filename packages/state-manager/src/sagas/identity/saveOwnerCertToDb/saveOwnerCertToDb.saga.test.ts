import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { type Socket } from '../../../types'
import { communitiesReducer, CommunitiesState, type communitiesActions } from '../../communities/communities.slice'
import { StoreKeys } from '../../store.keys'
import { identityAdapter } from '../identity.adapter'
import { identityReducer, IdentityState, type identityActions } from '../identity.slice'
import { saveOwnerCertToDbSaga } from './saveOwnerCertToDb.saga'
import { type Store } from '../../store.types'
import { type FactoryGirl } from 'factory-girl'
import { setupCrypto } from '@quiet/identity'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../../utils/tests/factories'
import { SocketActionTypes } from '@quiet/types'

describe('saveOwnerCertificateToDb', () => {
    let store: Store
    let factory: FactoryGirl

    beforeAll(async () => {
        setupCrypto()
        store = prepareStore().store
        factory = await getFactory(store)
    })

    test('save owner certificate to database', async () => {
        const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

        const community =
            await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

        const identity = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
            'Identity',
            {
                id: community.id,
                nickname: 'john',
            }
        )

        await expectSaga(saveOwnerCertToDbSaga, socket)
            .withReducer(
                combineReducers({
                    [StoreKeys.Communities]: communitiesReducer,
                    [StoreKeys.Identity]: identityReducer,
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
                }
            )
            .apply(socket, socket.emit, [
                SocketActionTypes.SAVE_OWNER_CERTIFICATE,
                {
                    id: community.id,
                    peerId: identity.peerId.id,
                    certificate: identity.userCertificate,
                    permsData: {
                        certificate: community.CA?.rootCertString,
                        privKey: community.CA?.rootKeyString,
                    },
                },
            ])
            .run()
    })
})
