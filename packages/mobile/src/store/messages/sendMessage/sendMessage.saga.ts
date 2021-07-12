import { Socket } from 'socket.io-client';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { PayloadAction } from '@reduxjs/toolkit';
import {
  keyFromCertificate,
  parseCertificate,
  sign,
} from '@zbayapp/identity/lib';
import { call, select, apply } from 'typed-redux-saga';
import { identitySelectors } from '../../identity/identity.selectors';
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors';
import { messagesActions } from '../messages.slice';
import { MessageTypes } from '../const/messageTypes';
import { arrayBufferToString } from 'pvutils';
import { navigateTo } from '../../../utils/functions/navigateTo/navigateTo';
import { ScreenNames } from '../../../const/ScreenNames.enum';
import { Dispatch } from 'react';
import { appImages } from '../../../../assets';
import { replaceScreen } from '../../../utils/functions/replaceScreen/replaceScreen';
import { generateMessageId, getCurrentTime } from '../utils/message.utils';

export function* sendMessageSaga(
  socket: Socket,
  action: PayloadAction<
    ReturnType<typeof messagesActions.sendMessage>['payload']
  >,
): Generator {
  const csr = yield* select(identitySelectors.userCsr);
  if (!csr) {
    yield* call(navigateTo, ScreenNames.ErrorScreen, {
      onPress: (_dispatch: Dispatch<any>) => {
        replaceScreen(ScreenNames.MainScreen);
      },
      icon: appImages.zbay_icon,
      title: 'Error',
      message:
        "User secrets are missing. You're not able to send messages without it. Try to restart the app or install it again.",
    });
    return;
  }

  const certificate = yield* select(identitySelectors.userCertificate);
  if (!certificate) {
    yield* call(navigateTo, ScreenNames.ErrorScreen, {
      onPress: (_dispatch: Dispatch<any>) => {
        replaceScreen(ScreenNames.MainScreen);
      },
      icon: appImages.zbay_icon,
      title: 'Error',
      message:
        'User certificate is missing. You need it to let the others know which messages was sent by you. Try to register your username again.',
    });
    return;
  }

  const parsedCertificate = yield* call(parseCertificate, certificate);
  const pubKey = yield* call(keyFromCertificate, parsedCertificate);

  const signatureArrayBuffer = yield* call(
    sign,
    action.payload,
    csr.pkcs10.privateKey,
  );
  const signature = yield* call(arrayBufferToString, signatureArrayBuffer);

  const channel = yield* select(publicChannelsSelectors.currentChannel);

  const messageId = yield* call(generateMessageId);

  const currentTime = yield* call(getCurrentTime);

  const message = {
    id: messageId,
    type: MessageTypes.BASIC,
    message: action.payload,
    createdAt: currentTime,
    signature: signature,
    pubKey: pubKey,
    channelId: channel,
  };

  yield* apply(socket, socket.emit, [
    SocketActionTypes.SEND_MESSAGE,
    {
      channelAddress: channel,
      message: message,
    },
  ]);
}
