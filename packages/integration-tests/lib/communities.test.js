"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const webcrypto_1 = require("@peculiar/webcrypto");
const communitiesTestUtils_1 = require("./communitiesTestUtils");
const identity_1 = require("@zbayapp/identity");
const nectar_1 = require("@zbayapp/nectar");
const nectar_2 = require("@zbayapp/nectar");
const identity_2 = __importDefault(require("@zbayapp/identity"));
const utils_1 = require("./utils");
const nectar_3 = require("@zbayapp/nectar");
const nectar_4 = require("@zbayapp/nectar");
const nectar_5 = require("@zbayapp/nectar");
const nectar_6 = require("@zbayapp/nectar");
const nectar_7 = require("@zbayapp/nectar");
jest.setTimeout(600000);
const crypto = new webcrypto_1.Crypto();
global.crypto = crypto;
describe('communities - with tor', () => {
    let owner;
    let userOne;
    let userTwo;
    beforeAll(async () => {
        owner = await (0, utils_1.createApp)();
        userOne = await (0, utils_1.createApp)();
        userTwo = await (0, utils_1.createApp)();
    });
    afterAll(async () => {
        await owner.manager.closeAllServices();
        await userOne.manager.closeAllServices();
        await userTwo.manager.closeAllServices();
    });
    test('Owner creates community', async () => {
        await (0, communitiesTestUtils_1.createCommunity)({ userName: 'Owner', store: owner.store });
    });
    test('Two users join community', async () => {
        const ownerData = (0, communitiesTestUtils_1.getCommunityOwnerData)(owner.store);
        await (0, communitiesTestUtils_1.joinCommunity)(Object.assign(Object.assign({}, ownerData), { store: userOne.store, userName: 'username1', expectedPeersCount: 2 }));
        await (0, communitiesTestUtils_1.joinCommunity)(Object.assign(Object.assign({}, ownerData), { store: userTwo.store, userName: 'username2', expectedPeersCount: 3 }));
    });
    test('Owner and users received certificates', async () => {
        await (0, communitiesTestUtils_1.assertReceivedCertificates)('owner', 3, 120000, owner.store);
        await (0, communitiesTestUtils_1.assertReceivedCertificates)('userOne', 3, 120000, userOne.store);
        await (0, communitiesTestUtils_1.assertReceivedCertificates)('userTwo', 3, 120000, userTwo.store);
    });
    test('Users replicated channel and subscribed to it', async () => {
        await (0, communitiesTestUtils_1.assertReceivedChannelsAndSubscribe)('owner', 1, 120000, owner.store);
        await (0, communitiesTestUtils_1.assertReceivedChannelsAndSubscribe)('userTwo', 1, 120000, userOne.store);
        await (0, communitiesTestUtils_1.assertReceivedChannelsAndSubscribe)('userTwo', 1, 120000, userTwo.store);
    });
    let ownerMessageData;
    let userOneMessageData;
    let userTwoMessageData;
    test('Every user sends one message to general channel', async () => {
        ownerMessageData = await (0, communitiesTestUtils_1.sendMessage)('owner says hi', owner.store);
        userOneMessageData = await (0, communitiesTestUtils_1.sendMessage)('userOne says hi', userOne.store);
        userTwoMessageData = await (0, communitiesTestUtils_1.sendMessage)('userTwo says hi', userTwo.store);
    });
    test('Every user replicated all messages', async () => {
        await (0, communitiesTestUtils_1.assertReceivedMessages)('owner', 3, 120000, owner.store);
        await (0, communitiesTestUtils_1.assertReceivedMessages)('userOne', 3, 120000, userOne.store);
        await (0, communitiesTestUtils_1.assertReceivedMessages)('userTwo', 3, 120000, userTwo.store);
    });
    test('Replicated messages are valid', async () => {
        await (0, communitiesTestUtils_1.assertReceivedMessagesAreValid)('owner', [ownerMessageData, userOneMessageData, userTwoMessageData], 20000, owner.store);
        await (0, communitiesTestUtils_1.assertReceivedMessagesAreValid)('userOne', [ownerMessageData, userOneMessageData, userTwoMessageData], 20000, owner.store);
        await (0, communitiesTestUtils_1.assertReceivedMessagesAreValid)('userTwo', [ownerMessageData, userOneMessageData, userTwoMessageData], 20000, owner.store);
    });
});
describe('communities - without tor', () => {
    let owner;
    let userOne;
    let userTwo;
    beforeAll(async () => {
        owner = await (0, utils_1.createAppWithoutTor)();
        userOne = await (0, utils_1.createAppWithoutTor)();
        userTwo = await (0, utils_1.createAppWithoutTor)();
    });
    afterAll(async () => {
        await owner.manager.closeAllServices();
        await userOne.manager.closeAllServices();
        await userTwo.manager.closeAllServices();
    });
    test('Owner creates community', async () => {
        await (0, communitiesTestUtils_1.createCommunity)({ userName: 'Owner', store: owner.store });
    });
    test('Two users join community', async () => {
        const ownerData = (0, communitiesTestUtils_1.getCommunityOwnerData)(owner.store);
        await (0, communitiesTestUtils_1.joinCommunity)(Object.assign(Object.assign({}, ownerData), { store: userOne.store, userName: 'username1', expectedPeersCount: 2 }));
        await (0, communitiesTestUtils_1.joinCommunity)(Object.assign(Object.assign({}, ownerData), { store: userTwo.store, userName: 'username2', expectedPeersCount: 3 }));
    });
    test('Owner and users received certificates', async () => {
        await (0, communitiesTestUtils_1.assertReceivedCertificates)('owner', 3, 120000, owner.store);
        await (0, communitiesTestUtils_1.assertReceivedCertificates)('userOne', 3, 120000, userOne.store);
        await (0, communitiesTestUtils_1.assertReceivedCertificates)('userTwo', 3, 120000, userTwo.store);
    });
    test('Users replicated channel and subscribed to it', async () => {
        await (0, communitiesTestUtils_1.assertReceivedChannelsAndSubscribe)('owner', 1, 120000, owner.store);
        await (0, communitiesTestUtils_1.assertReceivedChannelsAndSubscribe)('userTwo', 1, 120000, userOne.store);
        await (0, communitiesTestUtils_1.assertReceivedChannelsAndSubscribe)('userTwo', 1, 120000, userTwo.store);
    });
    let ownerMessageData;
    let userOneMessageData;
    let userTwoMessageData;
    test('Every user sends one message to general channel', async () => {
        ownerMessageData = await (0, communitiesTestUtils_1.sendMessage)('owner says hi', owner.store);
        userOneMessageData = await (0, communitiesTestUtils_1.sendMessage)('userOne says hi', userOne.store);
        userTwoMessageData = await (0, communitiesTestUtils_1.sendMessage)('userTwo says hi', userTwo.store);
    });
    test('Every user replicated all messages', async () => {
        await (0, communitiesTestUtils_1.assertReceivedMessages)('owner', 3, 120000, owner.store);
        await (0, communitiesTestUtils_1.assertReceivedMessages)('userOne', 3, 120000, userOne.store);
        await (0, communitiesTestUtils_1.assertReceivedMessages)('userTwo', 3, 120000, userTwo.store);
    });
    test('Replicated messages are valid', async () => {
        await (0, communitiesTestUtils_1.assertReceivedMessagesAreValid)('owner', [ownerMessageData, userOneMessageData, userTwoMessageData], 20000, owner.store);
        await (0, communitiesTestUtils_1.assertReceivedMessagesAreValid)('userOne', [ownerMessageData, userOneMessageData, userTwoMessageData], 20000, owner.store);
        await (0, communitiesTestUtils_1.assertReceivedMessagesAreValid)('userTwo', [ownerMessageData, userOneMessageData, userTwoMessageData], 20000, owner.store);
    });
});
describe('registrar', () => {
    let owner;
    beforeAll(async () => {
        owner = await (0, utils_1.createAppWithoutTor)();
    });
    afterAll(async () => {
        await owner.manager.closeAllServices();
    });
    test('try to join offline registrar', async () => {
        await (0, communitiesTestUtils_1.tryToJoinOfflineRegistrar)(owner.store);
    });
    test('launch communities and registrars on startup', async () => {
        // TODO: Move store mock into separate module and share between all the tests across nectar
        const community = {
            name: 'communityName',
            id: 'F1141EBCF93387E5A28696C5B41E2177',
            CA: {
                rootCertString: 'MIIBTTCB8wIBATAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTEwMTIyODEwMTAxMFoXDTMwMTIyODEwMTAxMFowEjEQMA4GA1UEAxMHWmJheSBDQTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABLr3fF0hy2gOYfXXQKAB2a7iIcLE2M1FQWlSYLOJkqAoBuaVr3tJ+H1wahj3TXdATrt4TNoQASUvprgCa1tO6e6jPzA9MA8GA1UdEwQIMAYBAf8CAQMwCwYDVR0PBAQDAgCGMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAKBggqhkjOPQQDAgNJADBGAiEAhTEZmbAaS4iyTVok8yApc44nmI1tkGiDE8fa5tXpDXMCIQCEwGwkz2mTq2vhr0gs20yDILobXpWaCd9G814o2qO/1w==',
                rootKeyString: 'MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgmu613x9FrbAQtIVD56oYGfq8YfeZ99ZZ/WXByN2dXzygCgYIKoZIzj0DAQehRANCAAS693xdIctoDmH110CgAdmu4iHCxNjNRUFpUmCziZKgKAbmla97Sfh9cGoY9013QE67eEzaEAElL6a4AmtbTunu',
            },
            registrarUrl: '',
            rootCa: '',
            peerList: [],
            registrar: {
                privateKey: '',
                address: '',
            },
            onionAddress: '',
            privateKey: '',
            port: 0,
        };
        const identity = {
            id: 'F1141EBCF93387E5A28696C5B41E2177',
            hiddenService: {
                onionAddress: 'ybrmqwsudwxjpzugnl66hx2526nox5nzgmrtzveteud5f7anpjw62zqd',
                privateKey: 'ED25519-V3:uJESjXQXngfVDTyKrztYrnY00lR5XZSNcHlxZlM/JV+exmG1nI8I+HVlpM6+G7yk4b53Lb3xnFmDWJ7GSN3gDQ==',
            },
            peerId: {
                id: 'QmXRJb5gdjcrb9VN1UEEnc5VYUHcDppJYykpf5QHWSrGjC',
                privKey: 'CAASqAkwggSkAgEAAoIBAQCj5CFP8qQHFAwJKr6tusf4CcLWhrGHaKuweiEoxJKggGM3I1UlB1h/Jn72gwj0RQACLm7Hwwr8gU0z5CIWfH6VBroz/xKNHCM0R6mn11b6GuFiqLJAHpvL733Quxsq61WmF5+vzppdqzcbm8pEAeo1zQqIkm1+zyi/kyzFCUgHUbCYR+yPsWNoYUL042q0XfdupK2FY+zq1IiIiiyWU2/wx/uNxrp1mM7uiy0d/4wRbuUMY965jurOdmE3LzRBR9J1GkHfA2MPnnrZxaJCwKnfLS1wE0Wpn2+r5+8C/rA3Jm5RURsi6D17NEBgUQdvjlkP5Bv4mMZ5B4Gi/0ocXPdrAgMBAAECggEAETpEyiueVGQmE7ybiJWOuaMFCRnlhW9aRNXBsJBhPV/hjgU3yQmposwAIpeJlGvAYXpSCMuW1w4ceGztrGFvyOiJIDga0hx4EuHJkqwPJ4E12fITsqvFAr3tAsj4RR2xxiDLl2ZnUZtS0qMgst9kqD0ic1K5EdBi3yhwV1HvcV1YmYW+xScgbnhjONRtPPdvg1fMxZ97eQ/xdjnpHsphsA9BOpgMKR9Jz/zIlER1zQJJKdivP6VLNZ2wua0E7T+Xo/1pnsG1wKuuLlfog2b8LNySVWrsVPuCdmsReaTlj0NuZcadTroMb6dQ79F30Zsb/IaRLMbHTx0s56MCI52h6QKBgQDki2KftprGbdLvrCCak2dBi02ocEC624d6SMCMnFzNVSBcyx1lGoiU1+wsT2+Ip4efTJLe2YBUBmgN1yWpe1z6rhaeHj3LasVJL5cHTvIxig8q73+P9Ta+sMK6pTpFPO2mwZnrdg0n1w5yfvuf2irCTZvd+Kt9B3Y+TSmlnEQW3QKBgQC3lGht7MALUuTFxKr0DG0Mqp7+73J0qyy01ZGJW05HjEW6ad/R8v8sLhWi3N4yZ48e8tf7cNofnEjNzlb2au2+26xwIWoe+BKAVUQ89iEOiqzZJI69U3/v+JlC6CPNQvITSYTBji9b4s9PMcV+qFf5Bn0Yh2qgcNfnoTMcK/lO5wKBgQCdvh76QZ0ebFr1FgcC6c6RDMczBReIYVFm86QC6UGcb68AnSjSybePlGDsTH+dAJS5PK76pYDPfgR/2QmjqwQH+fSeeh0Is88rrm89mh3MV5AUgG25PPTmNTaSgMxxUZZuTJ4iSL7XyrWsDT07ned5aPu1/5bNm0LfyX5/UhYk+QKBgFPiMl2YQqBp/jMIDH17eBDDnecrjocU+FahB+FVoU08IVhurGEIweR0IlrKxZUOkO05VcuE44ZyKSoxULdEYOJHCmIqQo1oGTweuhGI/c3hO930wGxuTRVf6NgTrthJ8MczXr/6slUwLD4ppe6cCaa2ek7NAcHSDjW/CNWkmkSdAoGBAJ3YMKwuvptdgMmRF2vp6EVhpRRKFAcL+GePoEKo0MXKi0n/YRcJYropgTN8Dt0mn9CHIjslmlyOAXQsXQzbEVrMXBWL3O/poB/gLUPdgN+vvomYL2jDIbnp+KnUGaGHz1yeEtFcq3LGNC0iY3WVCA7P9oUs5IFaEPsLsUCDgNRh',
                pubKey: 'CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCj5CFP8qQHFAwJKr6tusf4CcLWhrGHaKuweiEoxJKggGM3I1UlB1h/Jn72gwj0RQACLm7Hwwr8gU0z5CIWfH6VBroz/xKNHCM0R6mn11b6GuFiqLJAHpvL733Quxsq61WmF5+vzppdqzcbm8pEAeo1zQqIkm1+zyi/kyzFCUgHUbCYR+yPsWNoYUL042q0XfdupK2FY+zq1IiIiiyWU2/wx/uNxrp1mM7uiy0d/4wRbuUMY965jurOdmE3LzRBR9J1GkHfA2MPnnrZxaJCwKnfLS1wE0Wpn2+r5+8C/rA3Jm5RURsi6D17NEBgUQdvjlkP5Bv4mMZ5B4Gi/0ocXPdrAgMBAAE=',
            },
            dmKeys: {
                publicKey: '0bd934b164fdbf09a2675233bd9d5c396ce3a5944f92485c8c98b72ec3148f51',
                privateKey: '51da400fb7323793604ec204c60f3e1c96b1b3023d2eadc515376e37faf4b9f8',
            },
            zbayNickname: '',
            userCsr: undefined,
            userCertificate: '',
        };
        let communityChannels = {
            id: 'F1141EBCF93387E5A28696C5B41E2177',
            currentChannel: 'general',
            channels: nectar_7.publicChannelsAdapter.getInitialState(),
            channelMessages: nectar_7.channelMessagesAdapter.getInitialState(),
            channelLoadingSlice: 0,
        };
        const userCsr = await (0, identity_1.createUserCsr)({
            zbayNickname: 'fgdgfg',
            commonName: 'ybrmqwsudwxjpzugnl66hx2526nox5nzgmrtzveteud5f7anpjw62zqd',
            peerId: 'QmXRJb5gdjcrb9VN1UEEnc5VYUHcDppJYykpf5QHWSrGjC',
            dmPublicKey: '0bd934b164fdbf09a2675233bd9d5c396ce3a5944f92485c8c98b72ec3148f51',
            signAlg: identity_2.default.signAlg,
            hashAlg: identity_2.default.hashAlg,
        });
        userCsr.userKey =
            'MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgrSJ366ji2AfRNC9BDnViHl5V+A+fnjiUdUuPav3G8rygCgYIKoZIzj0DAQehRANCAAQpI18Np+59RC7UXkAfcl8mu8mrtgAwjv5pN18RmzGw2vV6iHbJ8RrujJZF9Z5rDqGYZAP2UCTyKzWTOC6740RD';
        identity.userCsr = userCsr;
        identity.userCertificate =
            'MIICDTCCAbMCBgF9Lq/VWDAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTIxMTExNzE2MTY1NVoXDTMwMDEzMTIzMDAwMFowSTFHMEUGA1UEAxM+eWJybXF3c3Vkd3hqcHp1Z25sNjZoeDI1MjZub3g1bnpnbXJ0enZldGV1ZDVmN2FucGp3NjJ6cWQub25pb24wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQpI18Np+59RC7UXkAfcl8mu8mrtgAwjv5pN18RmzGw2vV6iHbJ8RrujJZF9Z5rDqGYZAP2UCTyKzWTOC6740RDo4HCMIG/MAkGA1UdEwQCMAAwCwYDVR0PBAQDAgCOMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAvBgkqhkiG9w0BCQwEIgQgFzGXNQSk2IzgcI35nT9GmfKunA1jJHOdV6ZWRhOADhIwFgYKKwYBBAGDjBsCAQQIEwZmZ2RnZmcwPQYJKwYBAgEPAwEBBDATLlFtWFJKYjVnZGpjcmI5Vk4xVUVFbmM1VllVSGNEcHBKWXlrcGY1UUhXU3JHakMwCgYIKoZIzj0EAwIDSAAwRQIhAJmsMNFbttx9i0OMYIzKsALrfCUU8rX70S8Oj2IZp/vWAiA0b+6MR0ANnJkjW6HcClS6K2XHvOizmzQab+8rJNJVag==';
        const app = await (0, utils_1.createApp)({
            [nectar_1.StoreKeys.Communities]: Object.assign(Object.assign({}, new nectar_4.CommunitiesState()), { currentCommunity: 'F1141EBCF93387E5A28696C5B41E2177', communities: Object.assign({}, nectar_3.communitiesAdapter.setAll(nectar_3.communitiesAdapter.getInitialState(), [
                    community,
                ])) }),
            [nectar_1.StoreKeys.Identity]: Object.assign(Object.assign({}, new nectar_5.IdentityState()), { identities: Object.assign({}, nectar_2.identityAdapter.setAll(nectar_2.identityAdapter.getInitialState(), [
                    identity,
                ])) }),
            [nectar_1.StoreKeys.PublicChannels]: Object.assign(Object.assign({}, new nectar_6.PublicChannelsState()), { channels: nectar_7.communityChannelsAdapter.setAll(nectar_7.communityChannelsAdapter.getInitialState(), [communityChannels]) }),
        });
        await app.runSaga(communitiesTestUtils_1.launchCommunitiesOnStartupSaga).toPromise();
        await app.manager.closeAllServices();
    });
});
