"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchCommunitiesOnStartupSaga = exports.tryToJoinOfflineRegistrar = exports.joinCommunity = exports.createCommunity = exports.getCommunityOwnerData = exports.assertReceivedMessagesAreValid = exports.assertReceivedMessages = exports.sendMessage = exports.assertReceivedChannelsAndSubscribe = exports.assertReceivedCertificates = void 0;
const typed_redux_saga_1 = require("typed-redux-saga");
const wait_for_expect_1 = __importDefault(require("wait-for-expect"));
const nectar_1 = require("@zbayapp/nectar");
const nectar_2 = require("@zbayapp/nectar");
const nectar_3 = require("@zbayapp/nectar");
const nectar_4 = require("@zbayapp/nectar");
const utils_1 = require("../../utils");
const logger_1 = __importDefault(require("../../logger"));
const lib_1 = require("@zbayapp/identity/lib");
const log = (0, logger_1.default)();
async function assertReceivedCertificates(userName, expectedCount, maxTime = 600000, store) {
    log(`User ${userName} starts waiting ${maxTime}ms for certificates`);
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Users.certificates.ids).toHaveLength(expectedCount);
    }, maxTime);
    log(`User ${userName} received ${store.getState().Users.certificates.ids.length} certificates`);
}
exports.assertReceivedCertificates = assertReceivedCertificates;
async function assertReceivedChannelsAndSubscribe(userName, expectedCount, maxTime = 600000, store) {
    log(`User ${userName} starts waiting ${maxTime}ms for channels`);
    const communityId = store.getState().Communities.communities.ids[0];
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().PublicChannels.channels.entities[communityId].channels
            .ids).toHaveLength(expectedCount);
    }, maxTime);
    await store.dispatch(nectar_3.publicChannels.actions.setCurrentChannel(store.getState().PublicChannels.channels.entities[communityId].channels
        .ids[0]));
    await store.dispatch(nectar_3.publicChannels.actions.subscribeForAllTopics(communityId));
    log(`User ${userName} received ${store.getState().PublicChannels.channels.entities[communityId].channels
        .ids.length} channels`);
}
exports.assertReceivedChannelsAndSubscribe = assertReceivedChannelsAndSubscribe;
async function sendMessage(message, store) {
    store.dispatch(nectar_4.messages.actions.sendMessage(message));
    const communityId = store.getState().Communities.communities.ids[0];
    const certificate = store.getState().Identity.identities.entities[communityId].userCertificate;
    const parsedCertificate = await (0, lib_1.parseCertificate)(certificate);
    const publicKey = (0, lib_1.keyFromCertificate)(parsedCertificate);
    return {
        message,
        publicKey,
    };
}
exports.sendMessage = sendMessage;
async function assertReceivedMessages(userName, expectedCount, maxTime = 600000, store) {
    log(`User ${userName} starts waiting ${maxTime}ms for messages`);
    const communityId = store.getState().Communities.communities.ids[0];
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().PublicChannels.channels.entities[communityId]
            .channelMessages.general.ids).toHaveLength(expectedCount);
    }, maxTime);
    log(`User ${userName} received ${store.getState().PublicChannels.channels.entities[communityId]
        .channelMessages.general.ids.length} messages`);
}
exports.assertReceivedMessages = assertReceivedMessages;
async function assertReceivedMessagesAreValid(userName, messages, maxTime = 600000, store) {
    log(`User ${userName} checks if messages are valid`);
    const communityId = store.getState().Communities.communities.ids[0];
    const receivedMessages = Object.values(store.getState().PublicChannels.channels.entities[communityId]
        .channelMessages.general.messages);
    const validMessages = [];
    for (let receivedMessage of receivedMessages) {
        const msg = messages.filter(
        // @ts-ignorets-ignore
        (message) => message.publicKey === receivedMessage.pubKey);
        if (msg) {
            validMessages.push(msg);
        }
    }
    await (0, wait_for_expect_1.default)(() => {
        expect(validMessages).toHaveLength(messages.length);
    }, maxTime);
}
exports.assertReceivedMessagesAreValid = assertReceivedMessagesAreValid;
const getCommunityOwnerData = (ownerStore) => {
    const ownerStoreState = ownerStore.getState();
    const community = ownerStoreState.Communities.communities.entities[ownerStoreState.Communities.currentCommunity];
    const registrarAddress = community.onionAddress;
    const ownerIdentityState = ownerStore.getState().Identity;
    return {
        registrarAddress,
        communityId: community.id,
        ownerPeerId: ownerIdentityState.identities.entities[ownerIdentityState.identities.ids[0]].peerId.id,
        ownerRootCA: community.rootCa,
        registrarPort: community.port,
    };
};
exports.getCommunityOwnerData = getCommunityOwnerData;
async function createCommunity({ userName, store }) {
    const timeout = 120000;
    const communityName = 'CommunityName';
    store.dispatch(nectar_1.communities.actions.createNewCommunity(communityName));
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Identity.identities.ids).toHaveLength(1);
    }, timeout);
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Communities.communities.ids).toHaveLength(1);
    }, timeout);
    const communityId = store.getState().Communities.communities.ids[0];
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Identity.identities.entities[communityId].hiddenService
            .onionAddress).toBeTruthy();
    }, timeout);
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Identity.identities.entities[communityId].peerId.id).toHaveLength(46);
    }, timeout);
    store.dispatch(nectar_2.identity.actions.registerUsername(userName));
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Identity.identities.entities[communityId].userCertificate).toBeTruthy();
    }, timeout);
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Communities.communities.entities[communityId].CA).toHaveProperty('rootObject');
    }, timeout);
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Communities.communities.entities[communityId]
            .onionAddress).toBeTruthy();
    }, timeout);
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Users.certificates.ids).toHaveLength(1);
    }, timeout);
}
exports.createCommunity = createCommunity;
async function joinCommunity(payload) {
    const { registrarAddress, userName, ownerPeerId, ownerRootCA, expectedPeersCount, registrarPort, store, } = payload;
    const timeout = 120000;
    let address;
    if (payload.registrarAddress === '0.0.0.0') {
        address = `${registrarAddress}:${registrarPort}`;
    }
    else {
        address = registrarAddress;
    }
    store.dispatch(nectar_1.communities.actions.joinCommunity(address));
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Identity.identities.ids).toHaveLength(1);
    }, timeout);
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Communities.communities.ids).toHaveLength(1);
    }, timeout);
    const communityId = store.getState().Communities.communities.ids[0];
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Identity.identities.entities[communityId].hiddenService
            .onionAddress).toBeTruthy();
    }, timeout);
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Identity.identities.entities[communityId].peerId.id).toHaveLength(46);
    }, timeout);
    const userPeerId = store.getState().Identity.identities.entities[communityId].peerId.id;
    store.dispatch(nectar_2.identity.actions.registerUsername(userName));
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Identity.identities.entities[communityId].userCertificate).toBeTruthy();
    }, timeout);
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Communities.communities.entities[communityId].rootCa).toEqual(ownerRootCA);
    }, timeout);
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Communities.communities.entities[communityId].peerList
            .length).toEqual(expectedPeersCount);
    }, timeout);
    const peerList = store.getState().Communities.communities.entities[communityId].peerList;
    await (0, wait_for_expect_1.default)(() => {
        expect(peerList[0]).toMatch(new RegExp(ownerPeerId));
    }, timeout);
    await (0, wait_for_expect_1.default)(() => {
        expect(peerList[peerList.length - 1]).toMatch(new RegExp(userPeerId));
    }, timeout);
}
exports.joinCommunity = joinCommunity;
async function tryToJoinOfflineRegistrar(store) {
    const timeout = 120000;
    const userName = 'userName';
    store.dispatch(nectar_1.communities.actions.joinCommunity('yjnblkcrvqexxmntrs7hscywgebrizvz2jx4g4m5wq4x7uzi5syv5cid'));
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Identity.identities.ids).toHaveLength(1);
    }, timeout);
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Communities.communities.ids).toHaveLength(1);
    }, timeout);
    const communityId = store.getState().Communities.communities.ids[0];
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Identity.identities.entities[communityId].hiddenService
            .onionAddress).toHaveLength(62);
    }, timeout);
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Identity.identities.entities[communityId].peerId.id).toHaveLength(46);
    }, timeout);
    store.dispatch(nectar_2.identity.actions.registerUsername(userName));
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Errors[communityId].entities.registrar.type).toEqual('registrar');
    }, timeout);
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Errors[communityId].entities.registrar.message).toEqual('Registering username failed.');
    }, timeout);
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Errors[communityId].entities.registrar.communityId).toEqual(communityId);
    }, timeout);
    await (0, wait_for_expect_1.default)(() => {
        expect(store.getState().Errors[communityId].entities.registrar.code).toEqual(500);
    }, timeout);
}
exports.tryToJoinOfflineRegistrar = tryToJoinOfflineRegistrar;
function* launchCommunitiesOnStartupSaga() {
    yield* (0, typed_redux_saga_1.spawn)(utils_1.assertNoErrors);
    yield* (0, typed_redux_saga_1.take)(nectar_1.communities.actions.launchRegistrar);
    yield* (0, typed_redux_saga_1.take)(nectar_1.communities.actions.community);
    yield* (0, typed_redux_saga_1.take)(nectar_1.communities.actions.responseRegistrar);
}
exports.launchCommunitiesOnStartupSaga = launchCommunitiesOnStartupSaga;
