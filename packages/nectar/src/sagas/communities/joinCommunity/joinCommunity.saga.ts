import { put, apply, call } from 'typed-redux-saga';
import { communitiesActions } from '../communities.slice';
import { Socket } from 'socket.io-client';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { generateId } from '../../../utils/cryptography/cryptography';
import { PayloadAction } from '@reduxjs/toolkit';
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice';

export function* joinCommunitySaga(
  socket: Socket,
  action: PayloadAction<string>
): Generator {
  const id = yield* call(generateId);
  const payload = { id: id, name: '', CA: {}, registrarUrl: action.payload };
  yield* put(communitiesActions.addNewCommunity(payload));
  yield* put(publicChannelsActions.addPublicChannelsList(id))
  yield* put(communitiesActions.setCurrentCommunity(id));
  yield* apply(socket, socket.emit, [SocketActionTypes.CREATE_NETWORK, id]);
}
