import { PayloadAction } from '@reduxjs/toolkit';
import { identitySelectors } from '../../identity/identity.selectors';
import { identityActions } from '../../identity/identity.slice';
import { put, select } from 'typed-redux-saga';
import logger from '../../../utils/logger';
import { errorsActions, GENERAL_ERRORS } from '../errors.slice';
import { communitiesSelectors } from '../../communities/communities.selectors';
const log = logger('errors');

export function* handleErrorsSaga(
  action: PayloadAction<ReturnType<typeof errorsActions.addError>['payload']>
): Generator {
  log('received error', action.payload);

  if (action.payload.type === 'registrar') {
    const communityId = action.payload.communityId;
    const identity = yield* select(identitySelectors.selectById(communityId));
    const registrarAddress = yield* select(
      communitiesSelectors.registrarUrl(communityId)
    );

    const payload = {
      communityId,
      userCsr: identity.userCsr,
      registrarAddress,
    };
    yield* put(identityActions.storeUserCsr(payload));
    log(`registering certificate failed, trying again`);
  }

  const communityId = action.payload.communityId
    ? action.payload.communityId
    : GENERAL_ERRORS;
  yield* put({ type: `${communityId}.${action.payload.type}.error` });
}
