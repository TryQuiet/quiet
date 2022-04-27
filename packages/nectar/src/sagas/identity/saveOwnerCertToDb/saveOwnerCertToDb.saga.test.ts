import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { Socket } from 'socket.io-client'
import {
  communitiesReducer,
  CommunitiesState,
  Community
} from '../../communities/communities.slice'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { StoreKeys } from '../../store.keys'
import { identityAdapter } from '../identity.adapter'
import { identityReducer, IdentityState } from '../identity.slice'
import { Identity } from '../identity.types'
import { saveOwnerCertToDbSaga } from './saveOwnerCertToDb.saga'

describe('saveOwnerCertificateToDb', () => {
  test('save owner certificate to database', async () => {
    const community: Community = {
      name: 'communityName',
      id: 'id',
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
      rootCa: '',
      peerList: [],
      registrarUrl: '',
      registrar: null,
      onionAddress: '',
      privateKey: '',
      port: 0,
      registrationAttempts: 0
    }
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket
    const identity: Identity = {
      id: 'id',
      hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
      dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
      peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
      nickname: '',
      userCsr: undefined,
      userCertificate: ''
    }
    const communityId = 'id'
    await expectSaga(saveOwnerCertToDbSaga, socket)
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer
        }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id',
            communities: {
              ids: ['id'],
              entities: {
                id: community
              }
            }
          },
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            identities: identityAdapter.setAll(identityAdapter.getInitialState(), [identity])
          }
        }
      )
      .apply(socket, socket.emit, [
        SocketActionTypes.SAVE_OWNER_CERTIFICATE,
        {
          id: communityId,
          peerId: identity.peerId.id,
          certificate: identity.userCertificate,
          permsData: {
            certificate: community.CA.rootCertString,
            privKey: community.CA.rootKeyString
          }
        }
      ])
      .run()
  })
})
