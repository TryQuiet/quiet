import { call, select, put } from 'typed-redux-saga';
import { createUserCsr } from '@zbayapp/identity';
// import { initSelectors } from '../../init/init.selectors';
// import { initActions } from '../../init/init.slice';

import CryptoEngine from 'pkijs/src/CryptoEngine';
import { setEngine } from 'pkijs/src/common';
import { current, PayloadAction } from '@reduxjs/toolkit';
import { identityActions, UserCsr } from '../identity.slice';
import { identity } from 'src';
import { identitySelectors } from '../identity.selectors';
import { communitiesSelectors } from '../../communities/communities.selectors';

// TODO
// declare global {
//   interface Crypto {
//     subtle: any;
//   }
//   let crypto: Crypto;
// }

export function* createUserCsrSaga(
  action: PayloadAction<
    ReturnType<typeof identityActions.createUserCsr>['payload']
  >
): Generator {
  let csr: UserCsr;

  // TODO - Move to app
  // const isCryptoEngineInitialized = yield* select(
  //   initSelectors.isCryptoEngineInitialized,
  // );
  // if (!isCryptoEngineInitialized) {
  //   yield* call(initCryptoEngine);
  //   yield* put(initActions.setCryptoEngineInitialized(true));
  // }

  console.log('actionPayload is ', action.payload)

  try {
    // TODO Fix that type
    csr = yield* call(createUserCsr, action.payload) as any;
  } catch (e) {
    console.error(e);
    return;
  }

  console.log(
    'before storing user csr', csr
  )
  // TODO: Temporary hack - configure persistor

  //console.log(JSON.stringify(csr.pkcs10.privateKey), 'privateKey - strinfigy')
  // console.log(csr.pkcs10.privateKey.type, 'privateKey - rxport ')
  // console.log(typeof csr.pkcs10.privateKey.export)
  // console.log(csr.pkcs10.privateKey.export(), 'privateKey - rxport ')
  // console.log(csr.pkcs10.privateKey.export({format: 'jwk'}), 'privateKey - exprot jwk ')


  // csr.pkcs10.privateKey = Buffer.from(JSON.stringify(csr.pkcs10.privateKey)).toString('base64') as any
  // csr.pkcs10.publicKey = Buffer.from(JSON.stringify(csr.pkcs10.publicKey)).toString('base64') as any

  //yield* put(identityActions.storeOwnCertKey(csr.userKey))

  const currentCommunity = yield* select(communitiesSelectors.currentCommunity())
  

  const payload = {
    communityId: currentCommunity.id,
    userCsr: csr,
  registrarAddress: 'http://' + currentCommunity.onionAddress + '.onion:7789'  }

  yield* put(identityActions.storeUserCsr(payload));
}

// TODO: Move to apps

export const initCryptoEngine = () => {
  // TODO
  return;
  // setEngine(
  //   'newEngine',
  //   crypto,
  //   new CryptoEngine({
  //     name: '',
  //     crypto,
  //     subtle: crypto.subtle,
  //   })
  // );
};
