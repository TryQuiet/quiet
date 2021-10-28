import { publicChannelsActions } from '../publicChannels.slice';
import {  PayloadAction } from '@reduxjs/toolkit';
import { SocketActionTypes } from '../../socket/const/actionTypes';

import { apply, select } from 'typed-redux-saga';

import { Socket } from 'socket.io-client';
import { identitySelectors } from '../../identity/identity.selectors';

export function* createChannelSaga(  socket: Socket,
  action: PayloadAction<
    ReturnType<typeof publicChannelsActions.createChannel>['payload']
  >): Generator {

  const currentIdentity = yield* select(identitySelectors.currentIdentity);

  const peerId = currentIdentity.peerId.id

  yield* apply(socket, socket.emit, [
    SocketActionTypes.SUBSCRIBE_FOR_TOPIC,
    peerId,
    action.payload.channel
  ]);
}