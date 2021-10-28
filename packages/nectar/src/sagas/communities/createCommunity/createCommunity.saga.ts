import { createRootCA } from '@zbayapp/identity';
// @ts-ignore
import { Time } from 'pkijs';
import { call, apply, put } from 'typed-redux-saga';
import { communitiesActions } from '../communities.slice';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { generateId } from '../../../utils/cryptography/cryptography';
import { PayloadAction } from '@reduxjs/toolkit';
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice';

export function* createCommunitySaga(
  socket,
  action: PayloadAction<string>
): Generator {
  console.log('createCOmmuity')
  const notBeforeDate = new Date(Date.UTC(2010, 11, 28, 10, 10, 10));
  const notAfterDate = new Date(Date.UTC(2030, 11, 28, 10, 10, 10));
  const rootCa = yield* call(
    createRootCA,
    new Time({ type: 0, value: notBeforeDate }),
    new Time({ type: 0, value: notAfterDate })
  );
  const id = yield* call(generateId);
  const payload = {
    id: id,
    CA: rootCa,
    name: action.payload,
    registrarUrl: '',
  };
  yield* put(communitiesActions.addNewCommunity(payload));
  yield* put(publicChannelsActions.addPublicChannelsList(id))
  const channel = {
    name: 'general',
    description: 'general',
    owner: 'general',
    timestamp: Date.now(),
    address: 'general',
  };
  yield* put(publicChannelsActions.addChannel({communityId:id, channel: channel}))
  yield* put(communitiesActions.setCurrentCommunity(id));

  yield* apply(socket, socket.emit, [SocketActionTypes.CREATE_NETWORK, id]);
}