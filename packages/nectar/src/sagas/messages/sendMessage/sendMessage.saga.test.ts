import { expectSaga } from 'redux-saga-test-plan';
import { combineReducers } from '@reduxjs/toolkit';
import { call } from 'redux-saga-test-plan/matchers';
import { KeyObject } from 'crypto';
import {
  keyFromCertificate,
  loadPrivateKey,
  parseCertificate,
  sign,
} from '@zbayapp/identity/lib';
import { Socket } from 'socket.io-client';
import { arrayBufferToString } from 'pvutils';
import { identityReducer, IdentityState } from '../../identity/identity.slice';
import { StoreKeys } from '../../store.keys';
import { messagesActions } from '../messages.slice';
import { sendMessageSaga } from './sendMessage.saga';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { MessageTypes } from '../const/messageTypes';
import { generateMessageId, getCurrentTime } from '../utils/message.utils';
import { Identity } from '../../identity/identity.slice';
import { identityAdapter } from '../../identity/identity.adapter';
import {
  communitiesReducer,
  CommunitiesState,
  Community,
} from '../../communities/communities.slice';
import { communitiesAdapter } from '../../communities/communities.adapter';
import {
  CommunityChannels,
  publicChannelsReducer,
  PublicChannelsState,
} from '../../publicChannels/publicChannels.slice';
import {
  channelsByCommunityAdapter,
  publicChannelsAdapter,
} from '../../publicChannels/publicChannels.adapter';
import { IChannelInfo } from 'src';

describe('sendMessageSaga', () => {
  const communityId = 'id';

  const community: Community = {
    id: communityId,
    name: 'community',
    CA: null,
    rootCa: '',
    peerList: [],
    registrarUrl: 'registrarUrl',
    registrar: null,
    onionAddress: '',
    privateKey: '',
    port: 0,
  };

  const identity: Identity = {
    id: communityId,
    hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
    dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
    peerId: { id: 'id', pubKey: 'pubKey', privKey: 'privKey' },
    zbayNickname: '',
    userCsr: undefined,
    userCertificate: '',
  };

  const csr = {
    userCsr: 'userCsr',
    userKey: 'userKey',
    pkcs10: {
      publicKey: jest.fn() as unknown as KeyObject,
      privateKey: jest.fn() as unknown as KeyObject,
      pkcs10: {
        userKey: jest.fn() as unknown,
      },
    },
  };

  identity.userCertificate = 'userCertificate';
  identity.userCsr = csr;

  const publicChannel: IChannelInfo = {
    name: 'general',
    description: 'description',
    owner: 'user',
    timestamp: 0,
    address: 'address',
  };

  const communityChannels = new CommunityChannels(communityId);
  communityChannels.currentChannel = publicChannel.address;
  communityChannels.channels = publicChannelsAdapter.setAll(
    publicChannelsAdapter.getInitialState(),
    [publicChannel]
  );

  test('sign and send message', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket;

    await expectSaga(
      sendMessageSaga,
      socket,
      messagesActions.sendMessage('message')
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer,
          [StoreKeys.PublicChannels]: publicChannelsReducer,
        }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id',
            communities: communitiesAdapter.setAll(
              communitiesAdapter.getInitialState(),
              [community]
            ),
          },
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            identities: identityAdapter.setAll(
              identityAdapter.getInitialState(),
              [identity]
            ),
          },
          [StoreKeys.PublicChannels]: {
            ...new PublicChannelsState(),
            channels: channelsByCommunityAdapter.setAll(
              channelsByCommunityAdapter.getInitialState(),
              [communityChannels]
            ),
          },
        }
      )
      .provide([
        [call.fn(parseCertificate), 'certificate'],
        [call.fn(keyFromCertificate), 'key'],
        [call.fn(loadPrivateKey), 'privKey'],
        [call.fn(sign), jest.fn() as unknown as ArrayBuffer],
        [call.fn(arrayBufferToString), 'signature'],
        [call.fn(generateMessageId), 4],
        [call.fn(getCurrentTime), 8],
      ])
      .apply(socket, socket.emit, [
        SocketActionTypes.SEND_MESSAGE,
        identity.peerId.id,
        {
          channelAddress: publicChannel.address,
          message: {
            id: 4,
            type: MessageTypes.BASIC,
            message: 'message',
            createdAt: 8,
            signature: 'signature',
            pubKey: 'key',
            channelId: publicChannel.address,
          },
        },
      ])
      .run();
  });
});
