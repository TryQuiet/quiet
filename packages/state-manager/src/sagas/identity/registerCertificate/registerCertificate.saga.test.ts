import { expectSaga } from 'redux-saga-test-plan'
import { Socket } from '../../../types'
import { setupCrypto } from '@quiet/identity'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../../utils/tests/factories'
import { combineReducers } from '@reduxjs/toolkit'
import { reducers } from '../../reducers'
import { communitiesActions } from '../../communities/communities.slice'
import { identityActions } from '../identity.slice'
import { registerCertificateSaga } from './registerCertificate.saga'
import { CertData, RegisterCertificatePayload, SocketActionTypes, UserCsr } from '@quiet/types'

describe('registerCertificateSaga', () => {
  it('request certificate registration when user is community owner', async () => {
    setupCrypto()
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket
    const store = prepareStore().store

    const factory = await getFactory(store)

    const community = await factory.create<
      ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    const identity = await factory.create<
      ReturnType<typeof identityActions.addNewIdentity>['payload']
    >('Identity', {
      id: community.id
    })
    expect(identity.userCsr).not.toBeNull()
    const registerCertificatePayload: RegisterCertificatePayload = {
      communityId: community.id,
      nickname: identity.nickname,
      // @ts-expect-error
      userCsr: identity.userCsr
    }
    const reducer = combineReducers(reducers)
    await expectSaga(
      registerCertificateSaga,
      socket,
      identityActions.registerCertificate(registerCertificatePayload)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emit, [
        SocketActionTypes.REGISTER_OWNER_CERTIFICATE,
        {
          communityId: community.id,
          userCsr: identity.userCsr,
          permsData: {
            certificate: community.CA?.rootCertString,
            privKey: community.CA?.rootKeyString
          }
        }
      ])
      .not.apply(socket, socket.emit, [SocketActionTypes.REGISTER_USER_CERTIFICATE])
      .run()
  })

  it('request certificate registration when user is not community owner', async () => {
    setupCrypto()
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

    const store = prepareStore().store

    const factory = await getFactory(store)

    const community = await factory.create<
      ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community', {
      id: '1',
      name: 'rockets',
      registrarUrl: 'http://registrarUrl.onion',
      CA: null,
      rootCa: 'rootCa',
      peerList: [],
      registrar: null,
      onionAddress: '',
      privateKey: '',
      port: 0
    })

    const userCsr: UserCsr = {
      userCsr: 'userCsr',
      userKey: 'userKey',
      pkcs10: jest.fn() as unknown as CertData
    }

    const identity = (
      await factory.build<typeof identityActions.addNewIdentity>('Identity', {
        id: community.id
      })
    ).payload

    identity.userCsr = userCsr

    store.dispatch(identityActions.addNewIdentity(identity))

    const registerCertificatePayload: RegisterCertificatePayload = {
      communityId: community.id,
      nickname: identity.nickname,
      userCsr: identity.userCsr
    }

    const reducer = combineReducers(reducers)
    await expectSaga(
      registerCertificateSaga,
      socket,
      identityActions.registerCertificate(registerCertificatePayload)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.apply(socket, socket.emit, [SocketActionTypes.REGISTER_OWNER_CERTIFICATE])
      .apply(socket, socket.emit, [
        SocketActionTypes.REGISTER_USER_CERTIFICATE,
        {
          communityId: community.id,
          userCsr: identity.userCsr.userCsr,
          serviceAddress: community.registrarUrl
        }
      ])
      .run()
  })
})
