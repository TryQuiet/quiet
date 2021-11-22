import { take, spawn } from 'typed-redux-saga';
import waitForExpect from 'wait-for-expect';
import { communitiesActions } from '../sagas/communities/communities.slice';
import { identityActions } from '../sagas/identity/identity.slice';
import { messagesActions } from '../sagas/messages/messages.slice';
import logger from '../utils/logger';
import { assertNoErrors } from './utils';
import { publicChannelsActions } from '../sagas/publicChannels/publicChannels.slice';

import { keyFromCertificate, parseCertificate } from '@zbayapp/identity/lib';
import { Store } from 'redux';

const log = logger('tests');

export async function assertReceivedCertificates(
  userName: string,
  expectedCount: number,
  maxTime: number = 600000,
  store
) {
  log(`User ${userName} starts waiting ${maxTime}ms for certificates`);

  await waitForExpect(() => {
    expect(store.getState().Users.certificates.ids).toHaveLength(expectedCount);
  }, maxTime);

  log(
    `User ${userName} received ${
      store.getState().Users.certificates.ids.length
    } certificates`
  );
}

export async function assertReceivedChannelsAndSubscribe(
  userName: string,
  expectedCount: number,
  maxTime: number = 600000,
  store
) {
  log(`User ${userName} starts waiting ${maxTime}ms for channels`);

  const communityId = store.getState().Communities.communities.ids[0];

  await waitForExpect(() => {
    expect(
      store.getState().PublicChannels.channels.entities[communityId].channels
        .ids
    ).toHaveLength(expectedCount);
  }, maxTime);

  await store.dispatch(
    publicChannelsActions.setCurrentChannel(
      store.getState().PublicChannels.channels.entities[communityId].channels
        .ids[0]
    )
  );
  await store.dispatch(
    publicChannelsActions.subscribeForAllTopics(communityId)
  );

  log(
    `User ${userName} received ${
      store.getState().PublicChannels.channels.entities[communityId].channels
        .ids.length
    } channels`
  );
}

export async function sendMessage(
  message: string,
  store: Store
): Promise<{ message: string; publicKey: string }> {
  store.dispatch(messagesActions.sendMessage(message));

  const communityId = store.getState().Communities.communities.ids[0];
  const certificate =
    store.getState().Identity.identities.entities[communityId].userCertificate;

  const parsedCertificate = await parseCertificate(certificate);
  const publicKey = keyFromCertificate(parsedCertificate);

  return {
    message,
    publicKey,
  };
}

export async function assertReceivedMessages(
  userName: string,
  expectedCount: number,
  maxTime: number = 600000,
  store
) {
  log(`User ${userName} starts waiting ${maxTime}ms for messages`);

  const communityId = store.getState().Communities.communities.ids[0];

  await waitForExpect(() => {
    expect(
      store.getState().PublicChannels.channels.entities[communityId]
        .channelMessages.general.ids
    ).toHaveLength(expectedCount);
  }, maxTime);

  log(
    `User ${userName} received ${
      store.getState().PublicChannels.channels.entities[communityId]
        .channelMessages.general.ids.length
    } messages`
  );
}

export async function assertReceivedMessagesAreValid(
  userName: string,
  messages: any[],
  maxTime: number = 600000,
  store
) {
  log(`User ${userName} checks is messages are valid`);

  const communityId = store.getState().Communities.communities.ids[0];

  const receivedMessages = Object.values(
    store.getState().PublicChannels.channels.entities[communityId]
      .channelMessages.general.messages
  );

  const validMessages = [];

  for (let receivedMessage of receivedMessages) {
    console.log('inside loop');
    const msg = messages.filter(
      // @ts-ignorets-ignore
      (message) => message.publicKey === receivedMessage.pubKey
    );
    if (msg) {
      validMessages.push(msg);
    }
  }

  await waitForExpect(() => {
    expect(validMessages).toHaveLength(messages.length);
  }, maxTime);
}

export const getCommunityOwnerData = (ownerStore: any) => {
  const ownerStoreState = ownerStore.getState();
  const community =
    ownerStoreState.Communities.communities.entities[
      ownerStoreState.Communities.currentCommunity
    ];
  const registrarAddress = community.onionAddress;
  const ownerIdentityState = ownerStore.getState().Identity;
  return {
    registrarAddress,
    communityId: community.id,
    ownerPeerId:
      ownerIdentityState.identities.entities[
        ownerIdentityState.identities.ids[0]
      ].peerId.id,
    ownerRootCA: community.rootCa,
    registrarPort: community.port,
  };
};

export async function createCommunity({ userName, store }) {
  const timeout = 120_000;
  const communityName = 'CommunityName';

  store.dispatch(communitiesActions.createNewCommunity(communityName));

  await waitForExpect(() => {
    expect(store.getState().Identity.identities.ids).toHaveLength(1);
  }, timeout);
  await waitForExpect(() => {
    expect(store.getState().Communities.communities.ids).toHaveLength(1);
  }, timeout);

  const communityId = store.getState().Communities.communities.ids[0];

  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].hiddenService
        .onionAddress
    ).toBeTruthy();
  }, timeout);
  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].peerId.id
    ).toHaveLength(46);
  }, timeout);

  store.dispatch(identityActions.registerUsername(userName));

  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].userCertificate
    ).toBeTruthy();
  }, timeout);
  await waitForExpect(() => {
    expect(
      store.getState().Communities.communities.entities[communityId].CA
    ).toHaveProperty('rootObject');
  }, timeout);
  await waitForExpect(() => {
    expect(
      store.getState().Communities.communities.entities[communityId]
        .onionAddress
    ).toBeTruthy();
  }, timeout);
  await waitForExpect(() => {
    expect(store.getState().Users.certificates.ids).toHaveLength(1);
  }, timeout);
}

export async function joinCommunity(payload) {
  const {
    registrarAddress,
    userName,
    ownerPeerId,
    ownerRootCA,
    expectedPeersCount,
    registrarPort,
    store,
  } = payload;

  const timeout = 120_000;

  let address;
  if (payload.registrarAddress === '0.0.0.0') {
    address = `${registrarAddress}:${registrarPort}`;
  } else {
    address = registrarAddress;
  }

  store.dispatch(communitiesActions.joinCommunity(address));

  await waitForExpect(() => {
    expect(store.getState().Identity.identities.ids).toHaveLength(1);
  }, timeout);
  await waitForExpect(() => {
    expect(store.getState().Communities.communities.ids).toHaveLength(1);
  }, timeout);

  const communityId = store.getState().Communities.communities.ids[0];

  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].hiddenService
        .onionAddress
    ).toBeTruthy();
  }, timeout);
  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].peerId.id
    ).toHaveLength(46);
  }, timeout);

  const userPeerId =
    store.getState().Identity.identities.entities[communityId].peerId.id;

  store.dispatch(identityActions.registerUsername(userName));

  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].userCertificate
    ).toBeTruthy();
  }, timeout);
  await waitForExpect(() => {
    expect(
      store.getState().Communities.communities.entities[communityId].rootCa
    ).toEqual(ownerRootCA);
  }, timeout);

  await waitForExpect(() => {
    expect(
      store.getState().Communities.communities.entities[communityId].peerList
        .length
    ).toEqual(expectedPeersCount);
  }, timeout);

  const peerList =
    store.getState().Communities.communities.entities[communityId].peerList;

  await waitForExpect(() => {
    expect(peerList[0]).toMatch(new RegExp(ownerPeerId));
  }, timeout);

  await waitForExpect(() => {
    expect(peerList[peerList.length - 1]).toMatch(new RegExp(userPeerId));
  }, timeout);
}

export async function tryToJoinOfflineRegistrar(store) {
  const timeout = 120_000;
  const userName = 'userName';

  store.dispatch(
    communitiesActions.joinCommunity(
      'yjnblkcrvqexxmntrs7hscywgebrizvz2jx4g4m5wq4x7uzi5syv5cid'
    )
  );

  await waitForExpect(() => {
    expect(store.getState().Identity.identities.ids).toHaveLength(1);
  }, timeout);
  await waitForExpect(() => {
    expect(store.getState().Communities.communities.ids).toHaveLength(1);
  }, timeout);

  const communityId = store.getState().Communities.communities.ids[0];

  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].hiddenService
        .onionAddress
    ).toHaveLength(62);
  }, timeout);
  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].peerId.id
    ).toHaveLength(46);
  }, timeout);

  store.dispatch(identityActions.registerUsername(userName));

  await waitForExpect(() => {
    expect(
      store.getState().Errors[communityId].entities.registrar.type
    ).toEqual('registrar');
  }, timeout);
  await waitForExpect(() => {
    expect(
      store.getState().Errors[communityId].entities.registrar.message
    ).toEqual('Registering username failed.');
  }, timeout);
  await waitForExpect(() => {
    expect(
      store.getState().Errors[communityId].entities.registrar.communityId
    ).toEqual(communityId);
  }, timeout);
  await waitForExpect(() => {
    expect(
      store.getState().Errors[communityId].entities.registrar.code
    ).toEqual(500);
  }, timeout);
}

export function* launchCommunitiesOnStartupSaga(): Generator {
  yield* spawn(assertNoErrors);
  yield* take(communitiesActions.launchRegistrar);
  yield* take(communitiesActions.community);
  yield* take(communitiesActions.responseRegistrar);
}
