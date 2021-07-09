import { expectSaga } from 'redux-saga-test-plan'
import { combineReducers } from 'redux'
import { addCertificate } from './socket.saga'
import { StoreKeys } from '../../store/store.keys'
import {
  certificatesActions,
  certificatesReducer,
  CertificatesState
} from '../../store/certificates/certificates.reducer'
import identity, { Identity } from '../../store/handlers/identity'

describe('checkCertificatesSaga', () => {
  test('adds certificate if there is no certificate', async () => {
    const initialState = {
      [StoreKeys.Certificates]: {
        ...new CertificatesState(),
        ownCertificate: {
          certificate: '',
          privateKey: ''
        }
      },
      [StoreKeys.Identity]: {
        ...new Identity(),
        registrationStatus: {
          nickname: 'nickname',
          status: '',
          takenUsernames: ['']
        }
      }
    }

    await expectSaga(addCertificate)
      .withReducer(
        combineReducers({
          [StoreKeys.Certificates]: certificatesReducer,
          [StoreKeys.Identity]: identity.reducer
        }),
        initialState
      )
      .put(certificatesActions.creactOwnCertificate('nickname'))
      .hasFinalState(initialState)
      .run()
  })
  test("doesn't add certificate if there already is a certificate", async () => {
    const initialState = {
      [StoreKeys.Certificates]: {
        ...new CertificatesState(),
        ownCertificate: {
          certificate: 'some certificate',
          privateKey: ''
        }
      },
      [StoreKeys.Identity]: {
        ...new Identity(),
        registrationStatus: {
          nickname: 'nickname',
          status: '',
          takenUsernames: ['']
        }
      }
    }
    const runResult = await expectSaga(addCertificate)
      .withReducer(
        combineReducers({
          [StoreKeys.Certificates]: certificatesReducer,
          [StoreKeys.Identity]: identity.reducer
        }),
        initialState
      )
      .hasFinalState(initialState)
      .run()

    expect(runResult.effects.put).toBeUndefined()
  })
})
