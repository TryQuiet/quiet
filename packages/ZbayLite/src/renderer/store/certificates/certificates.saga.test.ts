import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { combineReducers } from 'redux'

import { dataFromRootPems } from '../../../shared/static'
import { certificatesActions, certificatesReducer, CertificatesState } from './certificates.reducer'
import { creactOwnCertificate, getDate } from './certificates.saga'
import { createUserCsr } from '../../pkijs/generatePems/requestCertificate'
import { createUserCert } from '../../pkijs/generatePems/generateUserCertificate'
import { StoreKeys } from '../store.keys'
import electronStore from '../../../shared/electronStore'
import { Store } from '../reducers'

describe('checkCertificatesSaga', () => {
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
        certificate: 'cert',
        privateKey: 'certKey'
      }
    }
  }

  const mockedDate = '01.01.2021'

  test('creating own cert', async () => {
    await expectSaga(creactOwnCertificate, { payload: 'name', type: certificatesActions.creactOwnCertificate.type })
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
          matchers.call(getDate),
          mockedDate
        ],
        [
          matchers.call(createUserCsr, {
            commonName: hiddenServices.libp2pHiddenService.onionAddress,
            peerId: 'peerId',
            zbayNickname: 'name'
          }),
          user
        ],
        [
          matchers.call(createUserCert, dataFromRootPems.certificate, dataFromRootPems.privKey, user.userCsr, mockedDate, new Date('1/1/2031')),
          {
            userCertObject: {},
            userCertString: 'cert'
          }
        ]
      ])
      .put(certificatesActions.setOwnCertificate('cert'))
      .put(certificatesActions.setOwnCertKey('certKey'))
      .put(certificatesActions.saveCertificate('cert'))
      .hasFinalState(expectedState)
      .run()
  })
})
