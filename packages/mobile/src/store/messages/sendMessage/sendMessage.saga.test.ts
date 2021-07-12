import { expectSaga } from 'redux-saga-test-plan';
import { combineReducers } from '@reduxjs/toolkit';
import { identityReducer, IdentityState } from '../../identity/identity.slice';
import { call } from 'redux-saga-test-plan/matchers';
import { StoreKeys } from '../../store.keys';
import {
  messagesActions,
  messagesReducer,
  MessagesState,
} from '../messages.slice';
import { sendMessageSaga } from './sendMessage.saga';

import { KeyObject } from 'crypto';
import {
  keyFromCertificate,
  parseCertificate,
  sign,
} from '@zbayapp/identity/lib';
import {
  publicChannelsReducer,
  PublicChannelsState,
} from '../../publicChannels/publicChannels.slice';
import { Socket } from 'socket.io-client';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { MessageTypes } from '../const/messageTypes';
import { arrayBufferToString } from 'pvutils';
import { generateMessageId, getCurrentTime } from '../utils/message.utils';

describe('sendMessageSaga', () => {
  test('sign and send message', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket;
    const csr = {
      userCsr: 'userCsr',
      userKey: 'userKey',
      pkcs10: {
        publicKey: jest.fn() as unknown as KeyObject,
        privateKey: jest.fn() as unknown as KeyObject,
        pkcs10: 'pkcs10',
      },
    };
    await expectSaga(
      sendMessageSaga,
      socket,
      messagesActions.sendMessage('message'),
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Identity]: identityReducer,
          [StoreKeys.PublicChannels]: publicChannelsReducer,
          [StoreKeys.Messages]: messagesReducer,
        }),
        {
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            userCsr: csr,
            userCertificate: 'certificate',
          },
          [StoreKeys.PublicChannels]: {
            ...new PublicChannelsState(),
            currentChannel: 'currentChannel',
          },
          [StoreKeys.Messages]: {
            ...new MessagesState(),
          },
        },
      )
      .provide([
        [call.fn(parseCertificate), 'certificate'],
        [call.fn(keyFromCertificate), 'key'],
        [call.fn(sign), jest.fn() as unknown as ArrayBuffer],
        [call.fn(arrayBufferToString), 'signature'],
        [call.fn(generateMessageId), 4],
        [call.fn(getCurrentTime), 8],
      ])
      .apply(socket, socket.emit, [
        SocketActionTypes.SEND_MESSAGE,
        {
          channelAddress: 'currentChannel',
          message: {
            id: 4,
            type: MessageTypes.BASIC,
            message: 'message',
            createdAt: 8,
            signature: 'signature',
            pubKey: 'key',
            channelId: 'currentChannel',
          },
        },
      ])
      .run();
  });
});
