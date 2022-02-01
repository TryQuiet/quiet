"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
require("@testing-library/jest-dom/extend-expect");
const test_utils_1 = require("react-dom/test-utils");
const dom_1 = require("@testing-library/dom");
const typed_redux_saga_1 = require("typed-redux-saga");
const socket_io_mock_1 = __importDefault(require("socket.io-mock"));
const setupTests_1 = require("../shared/setupTests");
const renderComponent_1 = require("../renderer/testUtils/renderComponent");
const prepareStore_1 = require("../renderer/testUtils/prepareStore");
const Channel_1 = __importDefault(require("../renderer/containers/pages/Channel"));
const nectar_1 = require("@zbayapp/nectar");
const identity_1 = require("@zbayapp/identity");
describe('Channel', () => {
    let socket;
    beforeEach(() => {
        socket = new socket_io_mock_1.default();
        setupTests_1.ioMock.mockImplementation(() => socket);
    });
    it("causes no error if there's no data yet", () => __awaiter(void 0, void 0, void 0, function* () {
        const { store } = yield (0, prepareStore_1.prepareStore)({}, socket // Fork Nectar's sagas
        );
        (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(Channel_1.default, null)), store);
        const channelName = dom_1.screen.queryByText('#');
        expect(channelName).toBeNull();
    }));
    it('displays properly on app (re)start', () => __awaiter(void 0, void 0, void 0, function* () {
        const { store } = yield (0, prepareStore_1.prepareStore)({}, socket // Fork Nectar's sagas
        );
        const factory = yield (0, nectar_1.getFactory)(store);
        // const community = await factory.create<
        // ReturnType<typeof communitiesActions.addNewCommunity>['payload']
        // >('Community')
        const alice = yield factory.create('Identity', { zbayNickname: 'alice' });
        (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(Channel_1.default, null)), store);
        const channelName = dom_1.screen.getByText('#general');
        expect(channelName).toBeVisible();
        const messageInput = dom_1.screen.getByPlaceholderText(`Message #general as @${alice.zbayNickname}`);
        expect(messageInput).toBeVisible();
    }));
    it('asks for missing messages and displays them', () => __awaiter(void 0, void 0, void 0, function* () {
        const { store, runSaga } = yield (0, prepareStore_1.prepareStore)({}, socket // Fork Nectar's sagas
        );
        const factory = yield (0, nectar_1.getFactory)(store);
        const community = yield factory.create('Community');
        const alice = yield factory.create('Identity', { id: community.id, zbayNickname: 'alice' });
        const aliceMessage = yield factory.create('Message', {
            identity: alice,
            verifyAutomatically: true
        });
        // Data from below will build but it won't be stored
        const john = (yield factory.build('Identity', {
            id: community.id,
            zbayNickname: 'john'
        })).payload;
        const johnMessage = (yield factory.build('Message', {
            identity: john
        })).payload;
        (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(Channel_1.default, null)), store);
        jest.spyOn(socket, 'emit').mockImplementation((action, ...input) => {
            if (action === nectar_1.SocketActionTypes.ASK_FOR_MESSAGES) {
                const data = input[0];
                if (data.ids.length > 1) {
                    fail('Requested too many massages');
                }
                if (data.ids[0] !== johnMessage.message.id) {
                    fail('Missing message has not been requested');
                }
                return socket.socketClient.emit(nectar_1.SocketActionTypes.INCOMING_MESSAGES, {
                    messages: [johnMessage.message],
                    communityId: data.communityId
                });
            }
        });
        // Log all the dispatched actions in order
        const actions = [];
        runSaga(function* () {
            while (true) {
                const action = yield* (0, typed_redux_saga_1.take)();
                actions.push(action.type);
            }
        });
        // Old message is already loaded
        const persistedMessage = yield dom_1.screen.findByText(aliceMessage.message.message);
        expect(persistedMessage).toBeVisible();
        // New message is not yet fetched from db
        expect(dom_1.screen.queryByText(johnMessage.message.message)).toBeNull();
        yield (0, test_utils_1.act)(() => __awaiter(void 0, void 0, void 0, function* () {
            yield runSaga(mockSendMessagesIds).toPromise();
        }));
        // New message is displayed
        const newMessage = yield dom_1.screen.findByText(johnMessage.message.message);
        expect(newMessage).toBeVisible();
        expect(actions).toMatchInlineSnapshot(`
      Array [
        "PublicChannels/responseSendMessagesIds",
        "PublicChannels/askForMessages",
        "PublicChannels/incomingMessages",
        "Messages/addPublicKeyMapping",
        "Messages/addMessageVerificationStatus",
      ]
    `);
        function* mockSendMessagesIds() {
            yield* (0, typed_redux_saga_1.apply)(socket.socketClient, socket.socketClient.emit, [
                nectar_1.SocketActionTypes.SEND_MESSAGES_IDS,
                {
                    peerId: alice.peerId.id,
                    channelAddress: 'general',
                    ids: [aliceMessage.message.id, johnMessage.message.id],
                    communityId: community.id
                }
            ]);
        }
    }));
    it('filters out suspicious messages', () => __awaiter(void 0, void 0, void 0, function* () {
        const { store, runSaga } = yield (0, prepareStore_1.prepareStore)({}, socket // Fork Nectar's sagas
        );
        const factory = yield (0, nectar_1.getFactory)(store);
        const community = yield factory.create('Community');
        const alice = yield factory.create('Identity', { id: community.id, zbayNickname: 'alice' });
        const john = yield factory.create('Identity', { id: community.id, zbayNickname: 'john' });
        const johnPublicKey = (0, identity_1.keyFromCertificate)((0, identity_1.parseCertificate)(john.userCertificate));
        const authenticMessage = Object.assign(Object.assign({}, (yield factory.build('Message', {
            identity: alice
        })).payload.message), { id: Math.random().toString(36).substr(2.9) });
        const spoofedMessage = Object.assign(Object.assign({}, (yield factory.build('Message', {
            identity: alice
        })).payload.message), { id: Math.random().toString(36).substr(2.9), pubKey: johnPublicKey });
        (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(Channel_1.default, null)), store);
        yield (0, test_utils_1.act)(() => __awaiter(void 0, void 0, void 0, function* () {
            yield runSaga(mockIncomingMessages).toPromise();
        }));
        // Verified message is shown
        const persistedMessage = yield dom_1.screen.findByText(authenticMessage.message);
        expect(persistedMessage).toBeVisible();
        // Spoofed message doesn't exist
        expect(dom_1.screen.queryByText(spoofedMessage.message)).toBeNull();
        function* mockIncomingMessages() {
            yield* (0, typed_redux_saga_1.apply)(socket.socketClient, socket.socketClient.emit, [
                nectar_1.SocketActionTypes.INCOMING_MESSAGES,
                {
                    messages: [authenticMessage, spoofedMessage],
                    communityId: community.id
                }
            ]);
        }
    }));
});
