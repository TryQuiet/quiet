import { call, select, put } from 'typed-redux-saga';
import { createUserCsr } from '@zbayapp/identity';
import { PayloadAction } from '@reduxjs/toolkit';
import { identityActions, UserCsr } from '../identity.slice';
import { communitiesSelectors } from '../../communities/communities.selectors';
import logger from '../../../utils/logger'
const log = logger('identity')

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
    registrarAddress: yield* select(communitiesSelectors.registrarUrl)
  };

  log('createUserCsrSaga');

  yield* put(identityActions.storeUserCsr(payload));
}
