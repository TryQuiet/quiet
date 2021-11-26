import { Socket } from 'socket.io-client';
import { PayloadAction } from '@reduxjs/toolkit';
import {
  keyFromCertificate,
  parseCertificate,
  sign,
  loadPrivateKey,
} from '@zbayapp/identity/lib';
import { call, select, apply } from 'typed-redux-saga';
import { arrayBufferToString } from 'pvutils';
import { config } from '../../users/const/certFieldTypes';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { identitySelectors } from '../../identity/identity.selectors';
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors';
import { messagesActions } from '../messages.slice';
import { MessageTypes } from '../const/messageTypes';
import { generateMessageId, getCurrentTime } from '../utils/message.utils';
import logger from '../../../utils/logger';
import { Identity } from 'src/sagas/identity/identity.slice';

const log = logger('message');

export function* sendMessageSaga(
  socket: Socket,
  action: PayloadAction<
    ReturnType<typeof messagesActions.sendMessage>['payload']
  >
): Generator {
  const identity: Identity = yield* select(identitySelectors.currentIdentity);

  const certificate = identity.userCertificate;

  log('sendMessageSaga-1');

  const parsedCertificate = yield* call(parseCertificate, certificate);
  const pubKey = yield* call(keyFromCertificate, parsedCertificate);
  const keyObject = yield* call(
    loadPrivateKey,
    identity.userCsr.userKey,
    config.signAlg
  );
  const signatureArrayBuffer = yield* call(sign, action.payload, keyObject);
  const signature = yield* call(arrayBufferToString, signatureArrayBuffer);

  const channelAddress = yield* select(publicChannelsSelectors.currentChannel);

  const messageId = yield* call(generateMessageId);
  const currentTime = yield* call(getCurrentTime);

  const message = {
    id: messageId,
    type: MessageTypes.BASIC,
    message: action.payload,
    createdAt: currentTime,
    signature,
    pubKey,
    channelId: channelAddress,
  };
  yield* apply(socket, socket.emit, [
    SocketActionTypes.SEND_MESSAGE,
    identity.peerId.id,
    {
      channelAddress: channelAddress,
      message,
    },
  ]);
}
