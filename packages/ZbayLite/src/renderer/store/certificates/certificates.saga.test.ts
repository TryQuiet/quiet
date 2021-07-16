import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { combineReducers } from 'redux'
import { certificatesActions, certificatesReducer, CertificatesState } from './certificates.reducer'
import { createOwnCertificate } from './certificates.saga'
import { createUserCsr } from '@zbayapp/identity'
import { StoreKeys } from '../store.keys'
import electronStore from '../../../shared/electronStore'
import { Store } from '../reducers'
import { registrationServiceAddress } from '../../../shared/static'

describe('createOwnCertificate', () => {
  const hiddenServices = {
    libp2pHiddenService: {
      onionAddress: 'onionAddress',
      privateKey: 'string'
    }
  }
  const user = {
    userCsr: 'certificateRequest',
    userKey: 'certKey',
    pkcs10: {}
  }
  const expectedState: Partial<Store> = {
    certificates: {
      ...new CertificatesState(),
      ownCertificate: {
        certificate: '',
        privateKey: 'certKey'
      }
    }
  }

  test('creates user csr and sends request to register user certificate', async () => {
    await expectSaga(createOwnCertificate, { payload: 'name', type: certificatesActions.createOwnCertificate.type })
      .withReducer(combineReducers({ [StoreKeys.Certificates]: certificatesReducer }), {
        [StoreKeys.Certificates]: {
          ...new CertificatesState()
        }
      })
      .provide([
        [
          matchers.apply(electronStore, electronStore.get, ['hiddenServices']),
          hiddenServices
        ],
        [
          matchers.apply(electronStore, electronStore.get, ['peerId']),
          'peerId'
        ],
        [
          matchers.call(createUserCsr, {
            commonName: hiddenServices.libp2pHiddenService.onionAddress,
            peerId: 'peerId',
            zbayNickname: 'name'
          }),
          user
        ]
      ])
      .put(certificatesActions.setOwnCertKey('certKey'))
      .put(
        certificatesActions.registerUserCertificate({
          serviceAddress: registrationServiceAddress,
          userCsr: user.userCsr
        })
      )
      .hasFinalState(expectedState)
      .run()
  })
})
