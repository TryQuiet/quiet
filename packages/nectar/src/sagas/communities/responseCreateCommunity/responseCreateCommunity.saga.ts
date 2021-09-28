import { put, call } from 'typed-redux-saga';
import { identityActions } from '../../identity/identity.slice';
import { generateDmKeyPair } from '../../../utils/cryptography/cryptography';
import { ResponseCreateCommunityPayload } from '../../communities/communities.slice';
import { PayloadAction } from '@reduxjs/toolkit';

export function* responseCreateCommunitySaga(
  action: PayloadAction<ResponseCreateCommunityPayload>
): Generator {
  const id = action.payload.id;
  const hiddenService = action.payload.payload.hiddenService;

  const peerId = action.payload.payload.peerId;

  const dmKeys = yield* call(generateDmKeyPair);

  yield* put(
    identityActions.addNewIdentity({
      id,
      hiddenService,
      peerId,
      dmKeys,
    })
  );
}
