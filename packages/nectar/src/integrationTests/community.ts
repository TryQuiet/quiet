import { createAction } from '@reduxjs/toolkit';
import assert from 'assert';
import { delay, fork, put, select, take } from 'typed-redux-saga';
import { identity } from '../index';
import { communitiesSelectors } from '../sagas/communities/communities.selectors';
import { communitiesActions } from '../sagas/communities/communities.slice';
import { errorsSelectors } from '../sagas/errors/errors.selectors';
import { errorsActions } from '../sagas/errors/errors.slice';
import { identitySelectors } from '../sagas/identity/identity.selectors';
import { identityActions } from '../sagas/identity/identity.slice';
import { SocketActionTypes } from '../sagas/socket/const/actionTypes';
import { usersSelectors } from '../sagas/users/users.selectors';
import logger from '../utils/logger';
import {
  assertListElementMatches,
  assertNoErrors,
  assertNotEmpty,
  createApp,
  createAppWithoutTor,
  finishTestSaga,
  integrationTest,
  userIsReady,
  watchResults,
} from './utils';
const log = logger('tests');

function* putAction(actionName: string) {
  yield* put(createAction(actionName)());
}

function* assertReceivedCertificates(
  runTestCaseSaga,
  userName: string,
  expectedCount: number,
  maxTime: number = 600000
) {
  log(`User ${userName} starts waiting ${maxTime}ms for certificates`);
  yield delay(maxTime);
  const certificates = yield* select(usersSelectors.certificates);
  const certificatesCount = Object.keys(certificates).length;
  assert.equal(
    certificatesCount,
    expectedCount,
    `User ${userName} received ${certificatesCount} certificates after ${maxTime}ms, expected ${expectedCount}`
  );
  log(`User ${userName} received all certificates`);
  runTestCaseSaga(putAction, 'userReplicatedCertificates');
}

function* createCommunityTestSaga(payload): Generator {
  const { userName } = payload;
  const communityName = 'CommunityName';
  yield* fork(assertNoErrors);
  yield* put(communitiesActions.createNewCommunity(communityName));
  yield* take(communitiesActions.responseCreateCommunity);
  yield* put(identityActions.registerUsername(userName));
  yield* take(identityActions.storeUserCertificate);
  yield* take(communitiesActions.community);
  yield* take(communitiesActions.responseRegistrar);
  yield* take(identityActions.savedOwnerCertificate);
  const currentCommunity = yield* select(communitiesSelectors.currentCommunity);
  assert.equal(currentCommunity.name, communityName);
  assert(currentCommunity.onionAddress);
  assert(currentCommunity.port);
  assert(currentCommunity.rootCa);
  const createdIdentity = yield* select(identitySelectors.currentIdentity);
  assert.equal(createdIdentity.zbayNickname, userName);
  assert.equal(createdIdentity.id, currentCommunity.id);
  assertNotEmpty(createdIdentity.peerId, 'Identity.peerId');
  assertNotEmpty(createdIdentity.userCertificate, 'Identity.userCertificate');
  assertNotEmpty(createdIdentity.hiddenService, 'Identity.hiddenService');
  yield* put(createAction('testContinue')());
}

function* joinCommunityTestSaga(payload): Generator {
  const {
    registrarAddress,
    userName,
    ownerPeerId,
    ownerRootCA,
    expectedPeersCount,
    registrarPort,
  } = payload;
  yield* fork(assertNoErrors);
  let address;
  if (payload.registrarAddress === 'http://0.0.0.0') {
    address = `${registrarAddress}:${registrarPort}`;
  } else {
    address = registrarAddress;
  }
  yield* put(communitiesActions.joinCommunity(address));

  yield* take(communitiesActions.responseCreateCommunity);
  yield* put(identity.actions.registerUsername(userName));
  yield* take(identityActions.storeUserCertificate);
  yield* take(communitiesActions.community);
  const currentCommunity = yield* select(communitiesSelectors.currentCommunity);
  const createdIdentity = yield* select(identitySelectors.currentIdentity);
  assert.equal(
    currentCommunity.rootCa,
    ownerRootCA,
    'User joining community should have the same rootCA as the owner'
  );
  assert.notEqual(
    currentCommunity.peerList,
    undefined,
    'User joining community should have a list of peers to connect to'
  );
  assert(
    currentCommunity.peerList.length >= expectedPeersCount,
    `User joining community should receive a list of ${expectedPeersCount} peers to connect to, received ${currentCommunity.peerList.length}.`
  );
  assertListElementMatches(currentCommunity.peerList, new RegExp(ownerPeerId));
  assertListElementMatches(
    currentCommunity.peerList,
    new RegExp(createdIdentity.peerId.id)
  );
  assert.equal(createdIdentity.zbayNickname, userName);
  assert.equal(createdIdentity.id, currentCommunity.id);
  assertNotEmpty(createdIdentity.peerId, 'Identity.peerId');
  assertNotEmpty(createdIdentity.userCertificate, 'Identity.userCertificate');
  assertNotEmpty(createdIdentity.hiddenService, 'Identity.hiddenService');
  yield* put(createAction('testContinue')());
}

const getCommunityOwnerData = (ownerStore: any) => {
  const ownerStoreState = ownerStore.getState();
  const community =
    ownerStoreState.Communities.communities.entities[
    ownerStoreState.Communities.currentCommunity
    ];
  const registrarAddress = `http://${community.onionAddress}`;
  const ownerIdentityState = ownerStore.getState().Identity;
  return {
    registrarAddress,
    communityId: community.id,
    ownerPeerId:
      ownerIdentityState.entities[ownerIdentityState.ids[0]].peerId.id,
    ownerRootCA: community.rootCa,
    registrarPort: community.port,
  };
};

const testUsersCreateAndJoinCommunitySuccessfully = async (testCase) => {
  const owner = await createApp();
  const user1 = await createApp();
  const user2 = await createApp();
  const allUsers = [owner, user1, user2];
  watchResults(allUsers, user2, 'Users create and join community successfully');
  // Owner creates community and registers
  owner.runSaga(integrationTest, createCommunityTestSaga, {
    userName: 'Owner',
  });

  const unsubscribeUser1 = user1.store.subscribe(() => {
    // Second user joins community and registers as soon as the first user finishes registering
    // TODO: make two users join community at the same time
    if (userIsReady(user1.store)) {
      unsubscribeUser1();
      user2.runSaga(integrationTest, joinCommunityTestSaga, {
        userName: 'User2',
        expectedPeersCount: 3,
        ...getCommunityOwnerData(owner.store),
      });
      // Watch all apps for received certificates:
      user2.runSaga(
        integrationTest,
        assertReceivedCertificates,
        testCase.runSaga,
        'User2',
        3
      );
      user1.runSaga(
        integrationTest,
        assertReceivedCertificates,
        testCase.runSaga,
        'User1',
        3
      );
      owner.runSaga(
        integrationTest,
        assertReceivedCertificates,
        testCase.runSaga,
        'Owner',
        3
      );
    }
  });

  const unsubscribeOwner = owner.store.subscribe(async () => {
    // First user joins community and registers as soon as the owner finishes registering
    if (userIsReady(owner.store)) {
      unsubscribeOwner();
      user1.runSaga(integrationTest, joinCommunityTestSaga, {
        userName: 'User1',
        ...getCommunityOwnerData(owner.store),
        expectedPeersCount: 2,
      });
    }
  });

  const testCaseUnsubscribe = testCase.store.subscribe(() => {
    // Check if all users replicated certificates. If so, finish the test
    if (
      testCase.store.getState().Test.usersWithReplicatedCertificates ===
      allUsers.length
    ) {
      testCaseUnsubscribe();
      user2.runSaga(finishTestSaga);
    }
  });
};

const testUsersCreateAndJoinCommunitySuccessfullyWithoutTor = async (
  testCase
) => {
  const owner = await createAppWithoutTor();
  const user1 = await createAppWithoutTor();
  const user2 = await createAppWithoutTor();
  const allUsers = [owner, user1, user2];
  watchResults(
    allUsers,
    user2,
    'Users create and join community successfully without tor'
  );

  // Owner creates community and registers
  owner.runSaga(integrationTest, createCommunityTestSaga, {
    userName: 'Owner',
  });

  const unsubscribeUser1 = user1.store.subscribe(() => {
    // Second user joins community and registers as soon as the first user finishes registering
    // TODO: make two users join community at the same time
    if (userIsReady(user1.store)) {
      unsubscribeUser1();
      user2.runSaga(integrationTest, joinCommunityTestSaga, {
        userName: 'User2',
        expectedPeersCount: 3,
        ...getCommunityOwnerData(owner.store),
      });
      // Watch all apps for received certificates:
      user2.runSaga(
        integrationTest,
        assertReceivedCertificates,
        testCase.runSaga,
        'User2',
        3
      );
      user1.runSaga(
        integrationTest,
        assertReceivedCertificates,
        testCase.runSaga,
        'User1',
        3
      );
      owner.runSaga(
        integrationTest,
        assertReceivedCertificates,
        testCase.runSaga,
        'Owner',
        3
      );
    }
  });

  const unsubscribeOwner = owner.store.subscribe(async () => {
    // First user joins community and registers as soon as the owner finishes registering
    if (userIsReady(owner.store)) {
      unsubscribeOwner();
      user1.runSaga(integrationTest, joinCommunityTestSaga, {
        userName: 'User1',
        ...getCommunityOwnerData(owner.store),
        expectedPeersCount: 2,
      });
    }
  });

  const testCaseUnsubscribe = testCase.store.subscribe(() => {
    // Check if all users replicated certificates. If so, finish the test
    if (
      testCase.store.getState().Test.usersWithReplicatedCertificates ===
      allUsers.length
    ) {
      testCaseUnsubscribe();
      user2.runSaga(finishTestSaga);
    }
  });
};

function* tryToJoinOfflineRegistrarTestSaga(): Generator {
  yield* put(
    communitiesActions.joinCommunity(
      `http://yjnblkcrvqexxmntrs7hscywgebrizvz2jx4g4m5wq4x7uzi5syv5cid.onion`
    )
  );
  yield* take(communitiesActions.responseCreateCommunity);
  const currentCommunityId = yield* select(
    communitiesSelectors.currentCommunityId
  );
  yield* put(identity.actions.registerUsername('IamTheUser'));
  yield* take(errorsActions.addError);
  const registrarError = (yield* select(
    errorsSelectors.currentCommunityErrorsByType
  ))[SocketActionTypes.REGISTRAR]
  assertNotEmpty(registrarError, 'Registrar error');
  assert.equal(registrarError.communityId, currentCommunityId);
  assert.equal(registrarError.code, 500);
  assert.equal(registrarError.message, 'Registering username failed.');
  yield* put(createAction('testFinished')());
}

const testUserTriesToJoinOfflineCommunity = async (testCase) => {
  const app = await createApp();
  watchResults(
    [app],
    app,
    'User receives error when tries to connect to offline registrar'
  );
  app.runSaga(integrationTest, tryToJoinOfflineRegistrarTestSaga);
};

export default {
  communityTestOfflineRegistrar: testUserTriesToJoinOfflineCommunity,
  communityTestWithTor: testUsersCreateAndJoinCommunitySuccessfully,
  communityTestWithoutTor:
    testUsersCreateAndJoinCommunitySuccessfullyWithoutTor,
};
