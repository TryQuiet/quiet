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
const createCommunity_1 = __importDefault(require("../renderer/containers/widgets/createCommunity/createCommunity"));
const CreateUsername_1 = __importDefault(require("../renderer/containers/widgets/createUsernameModal/CreateUsername"));
const modals_types_1 = require("../renderer/sagas/modals/modals.types");
const PerformCommunityAction_dictionary_1 = require("../renderer/components/widgets/performCommunityAction/PerformCommunityAction.dictionary");
const socket_io_mock_1 = __importDefault(require("socket.io-mock"));
const setupTests_1 = require("../shared/setupTests");
const nectar_1 = require("@zbayapp/nectar");
const Channel_1 = __importDefault(require("../renderer/containers/pages/Channel"));
const loadingPanel_1 = __importDefault(require("../renderer/containers/widgets/loadingPanel/loadingPanel"));
const loadingMessages_1 = require("../renderer/containers/widgets/loadingPanel/loadingMessages");
const payload = (id) => ({
    id: id,
    hiddenService: {
        onionAddress: 'ugmx77q2tnm5fliyfxfeen5hsuzjtbsz44tsldui2ju7vl5xj4d447yd',
        privateKey: 'ED25519-V3:eECPVkKQxx0SADnjaqAxheH797Q79D0DqGu8Pbc83mpfaZSujZdxqJ6r5ZwUDWCYAegWx2xNkMt7zUKXyxKOuQ=='
    },
    peerId: {
        id: 'QmPdB7oUGiDEz3oanj58Eba595H2dtNiKtW7bNTrBey5Az',
        privKey: 'CAASqAkwggSkAgEAAoIBAQCUGW9AvS5miIuhu2xk+OiaQpaTBPDjS22KOi2KfXXFfzwyZvduO0ZsOE5HxoGQ/kqL4QR2RhbTCZ8CNdkWPDR/s8fb7JGVRLkoexLzgMNs7OFg0JFy9AjmZ/vspE6y3irr/DH3bp/qiHTWiSvOGMaws3Ma74mqUyBKfK+hIri0/1xHGWNcIyhhjMy7f/ulZCOyd+G/jPA54BI36dSprzWSxdHbpcjAJo95OID9Y4HLOWP3BeMCodzslWpkPg+F9x4XjiXoFTgfGQqi3JpWNdgWHzpAQVgOGv5DO1a+OOKxjakAnFXgmg0CnbnzQR7oIHeutizz2MSmhrrKcG5WaDyBAgMBAAECggEAXUbrwE2m9ONZdqLyMWJoNghsh+qbwbzXIDFmT4yXaa2qf2BExQPGZhDMlP5cyrKuxw0RX2DjrUWpBZ5evVdsBWZ5IXYNd4NST0G8/OsDqw5DIVQb19gF5wBlNnWCL7woMnukCOB/Dhul4x2AHo2STuanP7bQ8RrsAp4njAivZydZADv2Xo4+ll+CBquJOHRMjcIqXzaKLoXTf80euskHfizFT4cFsI6oZygx8yqstoz2SBj2Qr3hvkUmSBFhE+dChIRrpcYuuz0JPpUTBmGgCLdKarUJHH1GJ4+wc6YU9YmJJ3kqyR+h/oVGaB1j4YOd5ubtJAIvf7uj0Ofhq1FJhQKBgQDrgsrUAZCafk81HAU25EmfrvH0jbTvZ7LmM86lntov8viOUDVk31F3u+CWGP7L/UomMIiveqO8J9OpQCvK8/AgIahtcB6rYyyb7XGLBn+njfVzdg8e2S4G91USeNuugYtwgpylkotOaAZrmiLgl415UgJvhAaOf+sMzV5xLREWMwKBgQCg+9iU7rDpgx8Tcd9tf5hGCwK9sorC004ffxtMXa+nN1I+gCfQH9eypFbmVnAo6YRQS02sUr9kSfB1U4f7Hk1VH/Wu+nRJNdTfz4uV5e65dSIo3kga8aTZ8YTIlqtDwcVv0GDCxDcstpdmR3scua0p2Oq22cYrmHOBgSGgdX0mewKBgQCPm/rImoet3ZW5IfQAC+blK424/Ww2jDpn63F4Rsxvbq6oQTq93vtTksoZXPaKN1KuxOukbZlIU9TaoRnTMTrcrQmCalsZUWlTT8/r4bOX3ZWtqXEA85gAgXNrxyzWVYJMwih5QkoWLpKzrJLV9zQ6pYp8q7o/zLrs3JJZWwzPRwKBgDrHWfAfKvdICfu2k0bO1NGWSZzr6OBz+M1lQplih7U9bMknT+IdDkvK13Po0bEOemI67JRj7j/3A1ZDdp4JFWFkdvc5uWXVwvEpPaUwvDZ4/0z+xEMaQf/VwI7g/I2T3bwS0JGsxRyNWsBcjyYQ4Zoq+qBi6YmXc20wsg99doGrAoGBAIXD8SW9TNhbo3uGK0Tz7y8bdYT4M9krM53M7I62zU6yLMZLTZHX1qXjbAFhEU5wVm6Mq0m83r1fiwnTrBQbn1JBtEIaxCeQ2ZH7jWmAaAOQ2z3qrHenD41WQJBzpWh9q/tn9JKD1KiWykQDfEnMgBt9+W/g3VgAF+CnR+feX6aH',
        pubKey: 'CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCUGW9AvS5miIuhu2xk+OiaQpaTBPDjS22KOi2KfXXFfzwyZvduO0ZsOE5HxoGQ/kqL4QR2RhbTCZ8CNdkWPDR/s8fb7JGVRLkoexLzgMNs7OFg0JFy9AjmZ/vspE6y3irr/DH3bp/qiHTWiSvOGMaws3Ma74mqUyBKfK+hIri0/1xHGWNcIyhhjMy7f/ulZCOyd+G/jPA54BI36dSprzWSxdHbpcjAJo95OID9Y4HLOWP3BeMCodzslWpkPg+F9x4XjiXoFTgfGQqi3JpWNdgWHzpAQVgOGv5DO1a+OOKxjakAnFXgmg0CnbnzQR7oIHeutizz2MSmhrrKcG5WaDyBAgMBAAE='
    }
});
describe('User', () => {
    let socket;
    let communityId;
    let payloadData;
    beforeEach(() => {
        socket = new socket_io_mock_1.default();
        setupTests_1.ioMock.mockImplementation(() => socket);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('creates community and registers username', () => __awaiter(void 0, void 0, void 0, function* () {
        const { store, runSaga } = yield (0, prepareStore_1.prepareStore)({}, socket // Fork Nectar's sagas
        );
        store.dispatch(modals_slice_1.modalsActions.openModal({ name: modals_types_1.ModalName.createCommunityModal }));
        (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(createCommunity_1.default, null),
            react_1.default.createElement(CreateUsername_1.default, null),
            react_1.default.createElement(Channel_1.default, null)), store);
        jest.spyOn(socket, 'emit').mockImplementation((action, ...input) => {
            if (action === nectar_1.SocketActionTypes.CREATE_NETWORK) {
                const data = input;
                const id = data[0];
                communityId = id;
                payloadData = payload(id);
                socket.socketClient.emit(nectar_1.SocketActionTypes.NETWORK, {
                    id: id,
                    payload: {
                        hiddenService: payloadData.hiddenService,
                        peerId: payloadData.peerId
                    }
                });
            }
            if (action === nectar_1.SocketActionTypes.REGISTER_OWNER_CERTIFICATE) {
                const data = input;
                const payload = data[0];
                socket.socketClient.emit(nectar_1.SocketActionTypes.SAVED_OWNER_CERTIFICATE, {
                    id: communityId,
                    payload: {
                        certificate: payload.userCsr,
                        rootCa: payload.permsData.certificate,
                        peers: []
                    }
                });
            }
            if (action === nectar_1.SocketActionTypes.CREATE_COMMUNITY) {
                const data = input;
                const payload = data[0];
                expect(payload.id).toEqual(communityId);
                socket.socketClient.emit(nectar_1.SocketActionTypes.COMMUNITY, {
                    id: payload.id
                });
                socket.socketClient.emit(nectar_1.SocketActionTypes.NEW_COMMUNITY, {
                    id: payload.id
                });
                socket.socketClient.emit(nectar_1.SocketActionTypes.RESPONSE_GET_PUBLIC_CHANNELS, {
                    communityId: communityId,
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
            if (action === nectar_1.SocketActionTypes.LAUNCH_REGISTRAR) {
                const data = input;
                const payload = data[0];
                expect(payload.id).toEqual(communityId);
                expect(payload.peerId).toEqual(payloadData.peerId.id);
                socket.socketClient.emit(nectar_1.SocketActionTypes.REGISTRAR, {
                    id: payload.id,
                    peerId: payload.peerId,
                    payload: {
                        privateKey: payloadData.hiddenService.privateKey,
                        onionAddress: payloadData.hiddenService.onionAddress,
                        port: 7909
                    }
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
        // Confirm proper modal title is displayed
        const dictionary = (0, PerformCommunityAction_dictionary_1.CreateCommunityDictionary)();
        const createCommunityTitle = dom_1.screen.getByText(dictionary.header);
        expect(createCommunityTitle).toBeVisible();
        // Enter community name and hit button
        const createCommunityInput = dom_1.screen.getByPlaceholderText(dictionary.placeholder);
        const createCommunityButton = dom_1.screen.getByText(dictionary.button);
        user_event_1.default.type(createCommunityInput, 'rockets');
        user_event_1.default.click(createCommunityButton);
        // Confirm user is being redirected to username registration
        const createUsernameTitle = yield dom_1.screen.findByText('Register a username');
        expect(createUsernameTitle).toBeVisible();
        // Enter username and hit button
        const createUsernameInput = yield dom_1.screen.findByPlaceholderText('Enter a username');
        const createUsernameButton = yield dom_1.screen.findByText('Register');
        user_event_1.default.type(createUsernameInput, 'alice');
        user_event_1.default.click(createUsernameButton);
        // Wait for the actions that updates the store
        yield (0, test_utils_1.act)(() => __awaiter(void 0, void 0, void 0, function* () { }));
        // Check if create/username modals are gone
        expect(createCommunityTitle).not.toBeVisible();
        expect(createUsernameTitle).not.toBeVisible();
        // Check if channel page is visible
        const channelPage = yield dom_1.screen.findByText('#general');
        expect(channelPage).toBeVisible();
        expect(actions).toMatchInlineSnapshot(`
      Array [
        "Modals/openModal",
        "Modals/openModal",
        "Communities/createNewCommunity",
        "Communities/addNewCommunity",
        "Communities/setCurrentCommunity",
        "PublicChannels/addPublicChannelsList",
        "Communities/responseCreateCommunity",
        "Identity/addNewIdentity",
        "Identity/registerUsername",
        "Identity/updateUsername",
        "Identity/createUserCsr",
        "Identity/storeUserCsr",
        "Communities/storePeerList",
        "Identity/storeUserCertificate",
        "Communities/updateCommunity",
        "Identity/savedOwnerCertificate",
        "Communities/updateCommunityData",
        "Communities/launchRegistrar",
        "Connection/addInitializedCommunity",
        "Identity/saveOwnerCertToDb",
        "PublicChannels/createGeneralChannel",
        "PublicChannels/responseGetPublicChannels",
        "PublicChannels/subscribeToAllTopics",
        "Communities/responseRegistrar",
        "Connection/addInitializedRegistrar",
        "PublicChannels/createChannel",
        "PublicChannels/subscribeToTopic",
        "PublicChannels/setCurrentChannel",
        "PublicChannels/addChannel",
        "Modals/closeModal",
        "Modals/closeModal",
        "Modals/closeModal",
        "Modals/closeModal",
      ]
    `);
    }));
    it('cannot see general channel until communities are initialized', () => __awaiter(void 0, void 0, void 0, function* () {
        const { store, runSaga } = yield (0, prepareStore_1.prepareStore)({}, socket // Fork Nectar's sagas
        );
        store.dispatch(modals_slice_1.modalsActions.openModal({ name: modals_types_1.ModalName.createCommunityModal }));
        (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(createCommunity_1.default, null),
            react_1.default.createElement(CreateUsername_1.default, null),
            react_1.default.createElement(loadingPanel_1.default, null),
            react_1.default.createElement(Channel_1.default, null)), store);
        jest.spyOn(socket, 'emit').mockImplementation((action, ...input) => {
            if (action === nectar_1.SocketActionTypes.CREATE_NETWORK) {
                const data = input;
                const id = data[0];
                payloadData = payload(id);
                socket.socketClient.emit(nectar_1.SocketActionTypes.NETWORK, {
                    id: id,
                    payload: {
                        hiddenService: payloadData.hiddenService,
                        peerId: payloadData.peerId
                    }
                });
            }
            if (action === nectar_1.SocketActionTypes.REGISTER_OWNER_CERTIFICATE) {
                const data = input;
                const payload = data[0];
                communityId = payload.id;
                socket.socketClient.emit(nectar_1.SocketActionTypes.SAVED_OWNER_CERTIFICATE, {
                    id: communityId,
                    payload: {
                        certificate: payload.permsData.certificate,
                        peers: [],
                        rootCa: 'MIIBTTCB8wIBATAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTEwMTIyODEwMTAxMFoXDTMwMTIyODEwMTAxMFowEjEQMA4GA1UEAxMHWmJheSBDQTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABBXmkE9W4NHQWUgmaH6j7TLSzOgyNIr8VshAeAMAg36IGvhtxhXNMUMYUApE7K9cifbxn6RVkSird97B7IFMefKjPzA9MA8GA1UdEwQIMAYBAf8CAQMwCwYDVR0PBAQDAgCGMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAKBggqhkjOPQQDAgNJADBGAiEAgY783/mGO15DK319VK/2wiAvq10oce4YdWdx2XUrKFoCIQDOh7r8ZlyLoNAT6FiNM/oBCaR3FrKmg7Nz4+ZbtvZMiw=='
                    }
                });
            }
            if (action === nectar_1.SocketActionTypes.CREATE_COMMUNITY) {
                const data = input;
                const payload = data[0];
                expect(payload.id).toEqual(communityId);
                socket.socketClient.emit(nectar_1.SocketActionTypes.NEW_COMMUNITY, {
                    id: payload.id
                });
                socket.socketClient.emit(nectar_1.SocketActionTypes.RESPONSE_GET_PUBLIC_CHANNELS, {
                    communityId: communityId,
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
            if (action === nectar_1.SocketActionTypes.LAUNCH_REGISTRAR) {
                const data = input;
                const payload = data[0];
                expect(payload.id).toEqual(communityId);
                expect(payload.peerId).toEqual(payloadData.peerId.id);
                socket.socketClient.emit(nectar_1.SocketActionTypes.REGISTRAR, {
                    id: payload.id,
                    peerId: payload.peerId,
                    payload: {
                        privateKey: payloadData.hiddenService.privateKey,
                        onionAddress: payloadData.hiddenService.onionAddress,
                        port: 7909
                    }
                });
            }
        });
        // Log all the dispatched actions in order
        const actions = [];
        runSaga(function* () {
            while (true) {
                const action = yield* (0, typed_redux_saga_1.take)();
                actions.push(action.type);
                console.log('Action:', action);
            }
        });
        // Confirm proper modal title is displayed
        const dictionary = (0, PerformCommunityAction_dictionary_1.CreateCommunityDictionary)();
        const createCommunityTitle = dom_1.screen.getByText(dictionary.header);
        expect(createCommunityTitle).toBeVisible();
        // Enter community name and hit button
        const createCommunityInput = dom_1.screen.getByPlaceholderText(dictionary.placeholder);
        const createCommunityButton = dom_1.screen.getByText(dictionary.button);
        user_event_1.default.type(createCommunityInput, 'rockets');
        user_event_1.default.click(createCommunityButton);
        // Confirm user is being redirected to username registration
        const createUsernameTitle = yield dom_1.screen.findByText('Register a username');
        expect(createUsernameTitle).toBeVisible();
        // Enter username and hit button
        const createUsernameInput = yield dom_1.screen.findByPlaceholderText('Enter a username');
        const createUsernameButton = yield dom_1.screen.findByText('Register');
        user_event_1.default.type(createUsernameInput, 'alice');
        user_event_1.default.click(createUsernameButton);
        // Wait for the actions that updates the store
        yield (0, test_utils_1.act)(() => __awaiter(void 0, void 0, void 0, function* () { }));
        // Check if 'creating community' loading panel is displayed
        yield (0, dom_1.waitFor)(() => {
            expect(dom_1.screen.getByText(loadingMessages_1.LoadingMessages.CreateCommunity)).toBeInTheDocument();
        });
        // General channel should be hidden
        // Note: channel view is present in the DOM but hidden by aria-hidden so getByRole is currently
        // the only way to check this kind of visibility.
        yield (0, dom_1.waitFor)(() => {
            expect(dom_1.screen.getByRole('heading', {
                name: /#general/i,
                hidden: true
            })).toBeInTheDocument();
        });
        expect(actions).toMatchInlineSnapshot(`
      Array [
        "Modals/openModal",
        "Modals/openModal",
        "Communities/createNewCommunity",
        "Communities/addNewCommunity",
        "Communities/setCurrentCommunity",
        "PublicChannels/addPublicChannelsList",
        "Communities/responseCreateCommunity",
        "Identity/addNewIdentity",
        "Identity/registerUsername",
        "Identity/updateUsername",
        "Identity/createUserCsr",
        "Identity/storeUserCsr",
        "Communities/storePeerList",
        "Identity/storeUserCertificate",
        "Communities/updateCommunity",
        "Identity/savedOwnerCertificate",
        "Communities/updateCommunityData",
        "Identity/saveOwnerCertToDb",
        "PublicChannels/createGeneralChannel",
        "PublicChannels/responseGetPublicChannels",
        "PublicChannels/subscribeToAllTopics",
        "PublicChannels/createChannel",
        "PublicChannels/subscribeToTopic",
        "PublicChannels/setCurrentChannel",
        "PublicChannels/addChannel",
      ]
    `);
    }));
});
