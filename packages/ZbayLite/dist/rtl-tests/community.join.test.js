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
const user_event_1 = __importDefault(require("@testing-library/user-event"));
const typed_redux_saga_1 = require("typed-redux-saga");
const renderComponent_1 = require("../renderer/testUtils/renderComponent");
const prepareStore_1 = require("../renderer/testUtils/prepareStore");
const modals_slice_1 = require("../renderer/sagas/modals/modals.slice");
const joinCommunity_1 = __importDefault(require("../renderer/containers/widgets/joinCommunity/joinCommunity"));
const CreateUsername_1 = __importDefault(require("../renderer/containers/widgets/createUsernameModal/CreateUsername"));
const loadingPanel_1 = __importDefault(require("../renderer/containers/widgets/loadingPanel/loadingPanel"));
const modals_types_1 = require("../renderer/sagas/modals/modals.types");
const PerformCommunityAction_dictionary_1 = require("../renderer/components/widgets/performCommunityAction/PerformCommunityAction.dictionary");
const socket_io_mock_1 = __importDefault(require("socket.io-mock"));
const setupTests_1 = require("../shared/setupTests");
const nectar_1 = require("@zbayapp/nectar");
const Channel_1 = __importDefault(require("../renderer/containers/pages/Channel"));
describe('User', () => {
    let socket;
    beforeEach(() => {
        socket = new socket_io_mock_1.default();
        setupTests_1.ioMock.mockImplementation(() => socket);
    });
    it('joins community and registers username', () => __awaiter(void 0, void 0, void 0, function* () {
        let community;
        let alice;
        const { store, runSaga } = yield (0, prepareStore_1.prepareStore)({}, socket // Fork Nectar's sagas
        );
        store.dispatch(modals_slice_1.modalsActions.openModal({ name: modals_types_1.ModalName.joinCommunityModal }));
        (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(joinCommunity_1.default, null),
            react_1.default.createElement(CreateUsername_1.default, null),
            react_1.default.createElement(Channel_1.default, null)), store);
        const factory = yield (0, nectar_1.getFactory)(store);
        jest
            .spyOn(socket, 'emit')
            .mockImplementation((action, ...input) => __awaiter(void 0, void 0, void 0, function* () {
            if (action === nectar_1.SocketActionTypes.CREATE_NETWORK) {
                const data = input;
                community = (yield factory.build('Community', {
                    id: data[0]
                })).payload;
                alice = (yield factory.build('Identity', {
                    id: community.id,
                    zbayNickname: 'alice'
                })).payload;
                return socket.socketClient.emit(nectar_1.SocketActionTypes.NETWORK, {
                    id: community.id,
                    payload: {
                        hiddenService: alice.hiddenService,
                        peerId: alice.peerId
                    }
                });
            }
            if (action === nectar_1.SocketActionTypes.REGISTER_USER_CERTIFICATE) {
                const data = input;
                const payload = data[0];
                expect(payload.id).toEqual(community.id);
                const certificate = yield (0, nectar_1.createUserCertificateTestHelper)({
                    zbayNickname: alice.zbayNickname,
                    commonName: alice.hiddenService.onionAddress,
                    peerId: alice.peerId.id
                }, community.CA);
                return socket.socketClient.emit(nectar_1.SocketActionTypes.SEND_USER_CERTIFICATE, {
                    id: payload.id,
                    payload: {
                        certificate: certificate,
                        rootCa: community.CA.rootCertString
                    }
                });
            }
            if (action === nectar_1.SocketActionTypes.LAUNCH_COMMUNITY) {
                const data = input;
                const payload = data[0];
                expect(payload.id).toEqual(community.id);
                socket.socketClient.emit(nectar_1.SocketActionTypes.COMMUNITY, {
                    id: payload.id
                });
                socket.socketClient.emit(nectar_1.SocketActionTypes.RESPONSE_GET_PUBLIC_CHANNELS, {
                    communityId: community.id,
                    channels: {
                        general: {
                            name: 'general',
                            description: 'string',
                            owner: 'owner',
                            timestamp: 0,
                            address: 'general'
                        }
                    }
                });
            }
        }));
        // Log all the dispatched actions in order
        const actions = [];
        runSaga(function* () {
            while (true) {
                const action = yield* (0, typed_redux_saga_1.take)();
                actions.push(action.type);
            }
        });
        // Confirm proper modal title is displayed
        const dictionary = (0, PerformCommunityAction_dictionary_1.JoinCommunityDictionary)();
        const joinCommunityTitle = dom_1.screen.getByText(dictionary.header);
        expect(joinCommunityTitle).toBeVisible();
        // Enter community address and hit button
        const joinCommunityInput = dom_1.screen.getByPlaceholderText(dictionary.placeholder);
        const joinCommunityButton = dom_1.screen.getByText(dictionary.button);
        user_event_1.default.type(joinCommunityInput, '3lyn5yjwwb74he5olv43eej7knt34folvrgrfsw6vzitvkxmc5wpe4yd');
        user_event_1.default.click(joinCommunityButton);
        // Confirm user is being redirected to username registration
        const createUsernameTitle = yield dom_1.screen.findByText('Register a username');
        expect(createUsernameTitle).toBeVisible();
        // Enter username and hit button
        const createUsernameInput = dom_1.screen.getByPlaceholderText('Enter a username');
        const createUsernameButton = dom_1.screen.getByText('Register');
        user_event_1.default.type(createUsernameInput, 'alice');
        user_event_1.default.click(createUsernameButton);
        // Wait for the actions that updates the store
        yield (0, test_utils_1.act)(() => __awaiter(void 0, void 0, void 0, function* () { }));
        // Check if join/username modals are gone
        expect(joinCommunityTitle).not.toBeVisible();
        expect(createUsernameTitle).not.toBeVisible();
        // Check if channel page is visible
        const channelPage = yield dom_1.screen.findByText('#general');
        expect(channelPage).toBeVisible();
        expect(actions).toMatchInlineSnapshot(`
      Array [
        "Modals/openModal",
        "Modals/openModal",
        "Communities/joinCommunity",
        "Communities/addNewCommunity",
        "PublicChannels/addPublicChannelsList",
        "Communities/setCurrentCommunity",
        "Communities/responseCreateCommunity",
        "Identity/addNewIdentity",
        "Identity/registerUsername",
        "Identity/updateUsername",
        "Identity/createUserCsr",
        "Identity/storeUserCsr",
        "Communities/storePeerList",
        "Identity/storeUserCertificate",
        "Communities/updateCommunity",
        "Communities/updateCommunityData",
        "Communities/launchCommunity",
        "Communities/launchRegistrar",
        "Connection/addInitializedCommunity",
        "PublicChannels/responseGetPublicChannels",
        "PublicChannels/subscribeToAllTopics",
        "PublicChannels/subscribeToTopic",
        "PublicChannels/addChannel",
        "Modals/closeModal",
        "Modals/closeModal",
        "Modals/closeModal",
        "Modals/closeModal",
      ]
    `);
    }));
    it('sees proper registration error when trying to join with already used username', () => __awaiter(void 0, void 0, void 0, function* () {
        let community;
        let alice;
        const { store, runSaga } = yield (0, prepareStore_1.prepareStore)({}, socket // Fork Nectar's sagas
        );
        store.dispatch(modals_slice_1.modalsActions.openModal({ name: modals_types_1.ModalName.joinCommunityModal }));
        (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(loadingPanel_1.default, null),
            react_1.default.createElement(joinCommunity_1.default, null),
            react_1.default.createElement(CreateUsername_1.default, null),
            react_1.default.createElement(Channel_1.default, null)), store);
        const factory = yield (0, nectar_1.getFactory)(store);
        jest
            .spyOn(socket, 'emit')
            .mockImplementation((action, ...input) => __awaiter(void 0, void 0, void 0, function* () {
            if (action === nectar_1.SocketActionTypes.CREATE_NETWORK) {
                const data = input;
                community = (yield factory.build('Community', {
                    id: data[0]
                })).payload;
                alice = (yield factory.build('Identity', {
                    id: community.id,
                    zbayNickname: 'alice'
                })).payload;
                return socket.socketClient.emit(nectar_1.SocketActionTypes.NETWORK, {
                    id: community.id,
                    payload: {
                        hiddenService: alice.hiddenService,
                        peerId: alice.peerId
                    }
                });
            }
            if (action === nectar_1.SocketActionTypes.REGISTER_USER_CERTIFICATE) {
                const data = input;
                const payload = data[0];
                expect(payload.id).toEqual(community.id);
                socket.socketClient.emit(nectar_1.SocketActionTypes.ERROR, {
                    type: nectar_1.SocketActionTypes.REGISTRAR,
                    message: nectar_1.ErrorMessages.USERNAME_TAKEN,
                    communityId: community.id,
                    code: nectar_1.ErrorCodes.VALIDATION
                });
            }
            if (action === nectar_1.SocketActionTypes.LAUNCH_COMMUNITY) {
                const data = input;
                const payload = data[0];
                expect(payload.id).toEqual(community.id);
                socket.socketClient.emit(nectar_1.SocketActionTypes.COMMUNITY, {
                    id: payload.id
                });
                socket.socketClient.emit(nectar_1.SocketActionTypes.RESPONSE_GET_PUBLIC_CHANNELS, {
                    communityId: community.id,
                    channels: {
                        general: {
                            name: 'general',
                            description: 'string',
                            owner: 'owner',
                            timestamp: 0,
                            address: 'general'
                        }
                    }
                });
            }
        }));
        // Log all the dispatched actions in order
        const actions = [];
        runSaga(function* () {
            while (true) {
                const action = yield* (0, typed_redux_saga_1.take)();
                actions.push(action.type);
            }
        });
        // Confirm proper modal title is displayed
        const dictionary = (0, PerformCommunityAction_dictionary_1.JoinCommunityDictionary)();
        const joinCommunityTitle = dom_1.screen.getByText(dictionary.header);
        expect(joinCommunityTitle).toBeVisible();
        // Enter community address and hit button
        const joinCommunityInput = dom_1.screen.getByPlaceholderText(dictionary.placeholder);
        const joinCommunityButton = dom_1.screen.getByText(dictionary.button);
        user_event_1.default.type(joinCommunityInput, '3lyn5yjwwb74he5olv43eej7knt34folvrgrfsw6vzitvkxmc5wpe4yd');
        user_event_1.default.click(joinCommunityButton);
        // Confirm user is being redirected to username registration
        const createUsernameTitle = yield dom_1.screen.findByText('Register a username');
        expect(createUsernameTitle).toBeVisible();
        // Enter username and hit button
        const createUsernameInput = dom_1.screen.getByPlaceholderText('Enter a username');
        const createUsernameButton = dom_1.screen.getByText('Register');
        user_event_1.default.type(createUsernameInput, 'bob');
        user_event_1.default.click(createUsernameButton);
        // Wait for the actions that updates the store
        yield (0, test_utils_1.act)(() => __awaiter(void 0, void 0, void 0, function* () { }));
        // Check if 'username taken' error message is visible
        expect(createUsernameTitle).toBeVisible();
        const usernameTakenErrorMessage = yield dom_1.screen.findByText(nectar_1.ErrorMessages.USERNAME_TAKEN);
        expect(usernameTakenErrorMessage).toBeVisible();
        expect(actions).toMatchInlineSnapshot(`
      Array [
        "Modals/openModal",
        "Modals/openModal",
        "Communities/joinCommunity",
        "Communities/addNewCommunity",
        "PublicChannels/addPublicChannelsList",
        "Communities/setCurrentCommunity",
        "Communities/responseCreateCommunity",
        "Identity/addNewIdentity",
        "Identity/registerUsername",
        "Identity/updateUsername",
        "Identity/createUserCsr",
        "Identity/storeUserCsr",
        "Errors/addError",
        "Modals/closeModal",
      ]
    `);
    }));
});
