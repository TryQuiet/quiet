import { expectSaga } from 'redux-saga-test-plan'
import { type Socket } from '../../../types'
import { setupCrypto } from '@quiet/identity'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../../utils/tests/factories'
import { combineReducers } from '@reduxjs/toolkit'
import { reducers } from '../../reducers'
import { communitiesActions } from '../../communities/communities.slice'
import { identityActions } from '../identity.slice'
import { registerCertificateSaga } from './registerCertificate.saga'
import { type CertData, SocketActionTypes, type UserCsr } from '@quiet/types'

describe('registerCertificateSaga', () => {
  it('request certificate registration when user is community owner', async () => {
    setupCrypto()
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket
    const store = prepareStore().store

    const factory = await getFactory(store)

    const community =
      await factory.create<ReturnType<typeof communitiesActions.storeCommunity>['payload']>('Community')

    const identity = await factory.create<ReturnType<typeof identityActions.storeIdentity>['payload']>('Identity', {
      id: community.id,
    })
    expect(identity.userCsr).not.toBeNull()

    const reducer = combineReducers(reducers)
    await expectSaga(registerCertificateSaga, socket)
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emit, [
        SocketActionTypes.REGISTER_OWNER_CERTIFICATE,
        {
          communityId: community.id,
          userCsr: identity.userCsr,
          permsData: {
            certificate: community.CA?.rootCertString,
            privKey: community.CA?.rootKeyString,
          },
        },
      ])
      .not.apply(socket, socket.emit, [SocketActionTypes.REGISTER_USER_CERTIFICATE])
      .run()
  })
})
