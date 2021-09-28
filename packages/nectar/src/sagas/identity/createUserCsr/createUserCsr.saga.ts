import { call, select, put } from 'typed-redux-saga';
import { createUserCsr } from '@zbayapp/identity';
import { PayloadAction } from '@reduxjs/toolkit';
import { identityActions, UserCsr } from '../identity.slice';
import { communitiesSelectors } from '../../communities/communities.selectors';

export function* createUserCsrSaga(
  action: PayloadAction<
    ReturnType<typeof identityActions.createUserCsr>['payload']
  >
): Generator {
  let csr: UserCsr;

  try {
    csr = yield* call(createUserCsr, action.payload);
  } catch (e) {
    console.error(e);
    return;
  }

  const currentCommunity = yield* select(communitiesSelectors.currentCommunity);

  const payload = {
    communityId: currentCommunity.id,
    userCsr: csr,
    registrarAddress: 'http://' + currentCommunity.onionAddress + '.onion:7789',
  };

  console.log('createUserCsrSaga');

  yield* put(identityActions.storeUserCsr(payload));
}
