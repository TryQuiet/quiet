var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
test('mock, because we keep those for the next iteration', () => __awaiter(this, void 0, void 0, function* () {
}));
// import { expectSaga } from 'redux-saga-test-plan'
// import * as matchers from 'redux-saga-test-plan/matchers'
// import { combineReducers } from 'redux'
// import { certificatesActions, certificatesReducer, CertificatesState } from './certificates.reducer'
// import { createOwnCertificate } from './certificates.saga'
// import { createUserCsr } from '@zbayapp/identity'
// import { StoreKeys } from '../store.keys'
// import electronStore from '../../../shared/electronStore'
// import { Store } from '../reducers'
// import { registrationServiceAddress } from '../../../shared/static'
// import { DirectMessages } from '../handlers/directMessages'
// describe('createOwnCertificate', () => {
//   const hiddenServices = {
//     libp2pHiddenService: {
//       onionAddress: 'onionAddress',
//       privateKey: 'string'
//     }
//   }
//   const user = {
//     userCsr: 'certificateRequest',
//     userKey: 'certKey',
//     pkcs10: {}
//   }
//   const expectedState: Partial<Store> = {
//     certificates: {
//       ...new CertificatesState(),
//       ownCertificate: {
//         certificate: '',
//         privateKey: 'certKey'
//       }
//     }
//   }
//   const initialState: Partial<Store> = {
//     [StoreKeys.Certificates]: {
//       ...new CertificatesState()
//     },
//     [StoreKeys.DirectMessages]: {
//       ...new DirectMessages(),
//       publicKey: 'publicKey'
//     }
//   }
//   test('creates user csr and sends request to register user certificate', async () => {
//     await expectSaga(createOwnCertificate, { payload: 'name', type: certificatesActions.createOwnCertificate.type })
//       .withReducer(combineReducers({ [StoreKeys.Certificates]: certificatesReducer }), initialState)
//       .provide([
//         [
//           matchers.apply(electronStore, electronStore.get, ['hiddenServices']),
//           hiddenServices
//         ],
//         [
//           matchers.apply(electronStore, electronStore.get, ['peerId']),
//           'peerId'
//         ],
//         [
//           matchers.call(createUserCsr, {
//             commonName: 'onionAddress',
//             peerId: 'peerId',
//             zbayNickname: 'name',
//             dmPublicKey: 'publicKey',
//             signAlg: 'ECDSA',
//             hashAlg: 'sha-256'
//           }),
//           user
//         ]
//       ])
//       .put(certificatesActions.setOwnCertKey('certKey'))
//       .put(
//         certificatesActions.registerUserCertificate({
//           serviceAddress: registrationServiceAddress,
//           userCsr: user.userCsr
//         })
//       )
//       .hasFinalState(expectedState)
//       .run()
//   })
// })
