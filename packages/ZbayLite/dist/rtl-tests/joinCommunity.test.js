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
const test_utils_1 = require("react-dom/test-utils");
require("@testing-library/jest-dom/extend-expect");
const dom_1 = require("@testing-library/dom");
const user_event_1 = __importDefault(require("@testing-library/user-event"));
const typed_redux_saga_1 = require("typed-redux-saga");
const renderComponent_1 = require("../renderer/testUtils/renderComponent");
const prepareStore_1 = require("../renderer/testUtils/prepareStore");
const store_keys_1 = require("../renderer/store/store.keys");
const socket_slice_1 = require("../renderer/sagas/socket/socket.slice");
const modals_slice_1 = require("../renderer/sagas/modals/modals.slice");
const joinCommunity_1 = __importDefault(require("../renderer/containers/widgets/joinCommunity/joinCommunity"));
const CreateUsername_1 = __importDefault(require("../renderer/containers/widgets/createUsernameModal/CreateUsername"));
const modals_types_1 = require("../renderer/sagas/modals/modals.types");
const PerformCommunityAction_dictionary_1 = require("../renderer/components/widgets/performCommunityAction/PerformCommunityAction.dictionary");
const socket_io_mock_1 = __importDefault(require("socket.io-mock"));
const setupTests_1 = require("../shared/setupTests");
const nectar_1 = require("@zbayapp/nectar");
describe('User', () => {
    let socket;
    let communityId;
    beforeEach(() => {
        socket = new socket_io_mock_1.default();
        setupTests_1.ioMock.mockImplementation(() => socket);
    });
    it('joins community and registers username', () => __awaiter(void 0, void 0, void 0, function* () {
        const { store, runSaga } = yield (0, prepareStore_1.prepareStore)({
            [store_keys_1.StoreKeys.Socket]: Object.assign(Object.assign({}, new socket_slice_1.SocketState()), { isConnected: false }),
            [store_keys_1.StoreKeys.Modals]: Object.assign(Object.assign({}, new modals_slice_1.ModalsInitialState()), { [modals_types_1.ModalName.joinCommunityModal]: { open: true } })
        }, socket // Fork Nectar's sagas
        );
        (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(joinCommunity_1.default, null),
            react_1.default.createElement(CreateUsername_1.default, null)), store);
        const factory = yield (0, nectar_1.getFactory)(store);
        jest
            .spyOn(socket, 'emit')
            .mockImplementation((action, ...input) => __awaiter(void 0, void 0, void 0, function* () {
            if (action === nectar_1.SocketActionTypes.CREATE_NETWORK) {
                const data = input;
                communityId = data[0];
                const holmes = (yield factory.build('Identity', {
                    id: communityId,
                    zbayNickname: 'holmes'
                })).payload;
                return socket.socketClient.emit(nectar_1.SocketActionTypes.NEW_COMMUNITY, {
                    id: communityId,
                    payload: holmes
                });
            }
            if (action === nectar_1.SocketActionTypes.REGISTER_USER_CERTIFICATE) {
                const data = input;
                const communityId = data[2];
                return socket.socketClient.emit(nectar_1.SocketActionTypes.SEND_USER_CERTIFICATE, {
                    id: communityId,
                    payload: {
                        certificate: 'MIIBTDCB8wIBATAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTEwMTIyODEwMTAxMFoXDTMwMTIyODEwMTAxMFowEjEQMA4GA1UEAxMHWmJheSBDQTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABEaV1l/7BOvPh0fFteSubIJ2r66YM4XoMMEfUhHiJE6O0ojfHdNrsItg+pHmpIQyEe+3YGWxIhgjL65+liE8ypqjPzA9MA8GA1UdEwQIMAYBAf8CAQMwCwYDVR0PBAQDAgCGMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAKBggqhkjOPQQDAgNIADBFAiARHtkv7GlhfkFbtRGU1r19UJFkhA7Vu+EubBnJPjD9/QIhALje1S3bp8w8jjVf70jGc2/uRmDCo/bNyQRpApBaD5vY'
                    }
                });
            }
        }));
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
        const createUsernameInput = yield dom_1.screen.findByPlaceholderText('Enter a username');
        const createUsernameButton = yield dom_1.screen.findByText('Register');
        user_event_1.default.type(createUsernameInput, 'holmes');
        user_event_1.default.click(createUsernameButton);
        yield (0, test_utils_1.act)(() => __awaiter(void 0, void 0, void 0, function* () {
            yield runSaga(testJoinCommunitySaga).toPromise();
            yield runSaga(mockChannelsResponse).toPromise();
        }));
        expect(createUsernameTitle).not.toBeVisible();
        expect(joinCommunityTitle).not.toBeVisible();
        function* testJoinCommunitySaga() {
            yield* (0, typed_redux_saga_1.take)(nectar_1.communities.actions.joinCommunity);
            yield* (0, typed_redux_saga_1.take)(nectar_1.communities.actions.responseCreateCommunity);
            yield* (0, typed_redux_saga_1.take)(nectar_1.identity.actions.registerUsername);
            yield* (0, typed_redux_saga_1.take)(nectar_1.identity.actions.storeUserCertificate);
        }
        function* mockChannelsResponse() {
            yield* (0, typed_redux_saga_1.apply)(socket.socketClient, socket.socketClient.emit, [
                nectar_1.SocketActionTypes.RESPONSE_GET_PUBLIC_CHANNELS,
                {
                    communityId: communityId,
                    channels: {
                        general: {
                            name: 'general',
                            description: 'string',
                            owner: 'owner',
                            timestamp: 0,
                            address: 'string'
                        }
                    }
                }
            ]);
        }
    }));
});
