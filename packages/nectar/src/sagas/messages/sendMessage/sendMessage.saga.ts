import { Socket } from 'socket.io-client';
import { PayloadAction } from '@reduxjs/toolkit';
import {
  keyFromCertificate,
  parseCertificate,
  sign,
  loadPrivateKey,
  extractPubKeyString,
} from '@zbayapp/identity/lib';

import { config } from '../../users/const/certFieldTypes';

import { call, select, apply } from 'typed-redux-saga';
import { arrayBufferToString } from 'pvutils';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { identitySelectors } from '../../identity/identity.selectors';
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors';
import { messagesActions } from '../messages.slice';
import { MessageTypes } from '../const/messageTypes';
// import { navigateTo } from '../../../utils/functions/navigateTo/navigateTo';
// import { ScreenNames } from '../../../const/ScreenNames.enum';
// import { Dispatch } from 'react';
// import { appImages } from '../../../../assets';
// import { replaceScreen } from '../../../utils/functions/replaceScreen/replaceScreen';
import { generateMessageId, getCurrentTime } from '../utils/message.utils';
import logger from '../../../utils/logger'
const log = logger('message')

export function* sendMessageSaga(
  socket: Socket,
  action: PayloadAction<
    ReturnType<typeof messagesActions.sendMessage>['payload']
  >
): Generator {
  const identity = yield* select(identitySelectors.currentIdentity);
  if (!identity.userCertificate) {
    // TODO
    // yield* call(navigateTo, ScreenNames.ErrorScreen, {
    //   onPress: (_dispatch: Dispatch<any>) => {
    //     replaceScreen(ScreenNames.MainScreen);
    //   },
    //   icon: appImages.zbay_icon,
    //   title: 'Error',
    //   message:
    //     "User secrets are missing. You're not able to send messages without it. Try to restart the app or install it again.",
    // });
    return;
  }
  log(identity.userCsr.pkcs10.privateKey, 'KeyObject');

  log('sendMessageSaga-1');

  const certificate = null;
  // const certificate = yield* select(identitySelectors.userCertificate);
  if (!certificate) {
    // TODO
    // yield* call(navigateTo, ScreenNames.ErrorScreen, {
    //   onPress: (_dispatch: Dispatch<any>) => {
    //     replaceScreen(ScreenNames.MainScreen);
    //   },
    //   icon: appImages.zbay_icon,
    //   title: 'Error',
    //   message:
    //     'User certificate is missing. You need it to let the others know which messages was sent by you. Try to register your username again.',
    // });
    return;
  }

  const parsedCertificate = yield* call(parseCertificate, certificate);
  const pubKey = yield* call(keyFromCertificate, parsedCertificate);
  const keyObject = yield* call(
    loadPrivateKey,
    identity.userCsr.userKey,
    config.signAlg
  );
  const signatureArrayBuffer = yield* call(sign, action.payload, keyObject);
  const signature = yield* call(arrayBufferToString, signatureArrayBuffer);

  const channel = yield* select(publicChannelsSelectors.currentChannel);

  const messageId = yield* call(generateMessageId);

  const currentTime = yield* call(getCurrentTime);

  const message = {
    id: messageId,
    type: MessageTypes.BASIC,
    message: action.payload,
    createdAt: currentTime,
    signature,
    pubKey,
    channelId: channel,
  };

  yield* apply(socket, socket.emit, [
    SocketActionTypes.SEND_MESSAGE,
    {
      communityId: identity.id,
      channelAddress: channel,
      message,
    },
  ]);
}
