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

export function* createUserCsrSaga(
  action: PayloadAction<
    ReturnType<typeof identityActions.createUserCsr>['payload']
  >
): Generator {
  let csr: UserCsr;

  try {
    csr = yield* call(createUserCsr, action.payload)
  } catch (e) {
    console.error(e);
    return;
  }

  const currentCommunity = yield* select(communitiesSelectors.currentCommunity)
  
  const payload = {
    communityId: currentCommunity.id,
    userCsr: csr,
  registrarAddress: 'http://' + currentCommunity.onionAddress + '.onion:7789'  }

  yield* put(identityActions.storeUserCsr(payload));
}
