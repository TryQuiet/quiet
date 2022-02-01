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
const dom_1 = require("@testing-library/dom");
const user_event_1 = __importDefault(require("@testing-library/user-event"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const prepareStore_1 = require("../../../testUtils/prepareStore");
const store_keys_1 = require("../../../store/store.keys");
const socket_slice_1 = require("../../../sagas/socket/socket.slice");
const modals_types_1 = require("../../../sagas/modals/modals.types");
const modals_slice_1 = require("../../../sagas/modals/modals.slice");
const joinCommunity_1 = __importDefault(require("./joinCommunity"));
const createCommunity_1 = __importDefault(require("../createCommunity/createCommunity"));
const PerformCommunityAction_dictionary_1 = require("../../../components/widgets/performCommunityAction/PerformCommunityAction.dictionary");
const CreateUsername_1 = __importDefault(require("../createUsernameModal/CreateUsername"));
const loadingPanel_1 = __importDefault(require("../loadingPanel/loadingPanel"));
const nectar_1 = require("@zbayapp/nectar");
const loadingMessages_1 = require("../loadingPanel/loadingMessages");
describe('join community', () => {
    it('users switches from join to create', () => __awaiter(void 0, void 0, void 0, function* () {
        const { store } = yield (0, prepareStore_1.prepareStore)({
            [store_keys_1.StoreKeys.Socket]: Object.assign(Object.assign({}, new socket_slice_1.SocketState()), { isConnected: true }),
            [store_keys_1.StoreKeys.Modals]: Object.assign(Object.assign({}, new modals_slice_1.ModalsInitialState()), { [modals_types_1.ModalName.joinCommunityModal]: { open: true } })
        });
        (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(joinCommunity_1.default, null),
            react_1.default.createElement(createCommunity_1.default, null)), store);
        // Confirm proper modal title is displayed
        const joinCommunityDictionary = (0, PerformCommunityAction_dictionary_1.JoinCommunityDictionary)();
        const joinCommunityTitle = dom_1.screen.getByText(joinCommunityDictionary.header);
        expect(joinCommunityTitle).toBeVisible();
        // Click redirecting link
        const link = dom_1.screen.getByTestId('JoinCommunityLink');
        user_event_1.default.click(link);
        // Confirm user is being redirected to create community
        const createCommunityDictionary = (0, PerformCommunityAction_dictionary_1.CreateCommunityDictionary)();
        const createCommunityTitle = yield dom_1.screen.findByText(createCommunityDictionary.header);
        expect(createCommunityTitle).toBeVisible();
    }));
    it('user goes form joning community to username registration, then comes back', () => __awaiter(void 0, void 0, void 0, function* () {
        const { store } = yield (0, prepareStore_1.prepareStore)({
            [store_keys_1.StoreKeys.Socket]: Object.assign(Object.assign({}, new socket_slice_1.SocketState()), { isConnected: true }),
            [store_keys_1.StoreKeys.Modals]: Object.assign(Object.assign({}, new modals_slice_1.ModalsInitialState()), { [modals_types_1.ModalName.joinCommunityModal]: { open: true } })
        });
        (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(joinCommunity_1.default, null),
            react_1.default.createElement(CreateUsername_1.default, null)), store);
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
        // Close username registration modal
        const closeButton = yield dom_1.screen.findByTestId('createUsernameModalActions');
        user_event_1.default.click(closeButton);
        expect(joinCommunityTitle).toBeVisible();
    }));
    it('user rejoins to remembered community without user data', () => __awaiter(void 0, void 0, void 0, function* () {
        const { store } = yield (0, prepareStore_1.prepareStore)({
            [store_keys_1.StoreKeys.Socket]: Object.assign(Object.assign({}, new socket_slice_1.SocketState()), { isConnected: true }),
            [store_keys_1.StoreKeys.Modals]: Object.assign(Object.assign({}, new modals_slice_1.ModalsInitialState()), { [modals_types_1.ModalName.joinCommunityModal]: { open: true } }),
            [nectar_1.StoreKeys.Communities]: Object.assign({}, new nectar_1.communities.State())
        });
        const factory = yield (0, nectar_1.getFactory)(store);
        yield factory.create('Community');
        (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(joinCommunity_1.default, null),
            react_1.default.createElement(CreateUsername_1.default, null)), store);
        const createUsernameTitle = dom_1.screen.getByText('Register a username');
        expect(createUsernameTitle).toBeVisible();
    }));
    it('user rejoins to remembered community with certificate', () => __awaiter(void 0, void 0, void 0, function* () {
        const factoryStore = (yield (0, prepareStore_1.prepareStore)()).store;
        const factory = yield (0, nectar_1.getFactory)(factoryStore);
        const community = yield factory.create('Community');
        const identityAlpha = {
            id: community.id,
            zbayNickname: 'nickname',
            hiddenService: {
                onionAddress: '',
                privateKey: ''
            },
            dmKeys: {
                publicKey: '',
                privateKey: ''
            },
            peerId: {
                id: '',
                pubKey: '',
                privKey: ''
            },
            userCsr: null,
            userCertificate: ''
        };
        const { store } = yield (0, prepareStore_1.prepareStore)({
            [store_keys_1.StoreKeys.Socket]: Object.assign(Object.assign({}, new socket_slice_1.SocketState()), { isConnected: true }),
            [store_keys_1.StoreKeys.Modals]: Object.assign(Object.assign({}, new modals_slice_1.ModalsInitialState()), { [modals_types_1.ModalName.joinCommunityModal]: { open: true } }),
            [nectar_1.StoreKeys.Communities]: factoryStore.getState().Communities,
            [nectar_1.StoreKeys.Identity]: Object.assign(Object.assign({}, new nectar_1.identity.State()), { identities: nectar_1.identityAdapter.setAll(nectar_1.identityAdapter.getInitialState(), [identityAlpha]) })
        });
        const result1 = (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(joinCommunity_1.default, null),
            react_1.default.createElement(CreateUsername_1.default, null),
            react_1.default.createElement(loadingPanel_1.default, null)), store);
        const switchLink1 = result1.queryByText(loadingMessages_1.LoadingMessages.CreateCommunity);
        expect(switchLink1).not.toBeNull();
        store.dispatch(nectar_1.identity.actions.storeUserCertificate({
            userCertificate: 'userCert',
            communityId: community.id
        }));
        const result2 = (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(joinCommunity_1.default, null),
            react_1.default.createElement(CreateUsername_1.default, null),
            react_1.default.createElement(loadingPanel_1.default, null)), store);
        const switchLink2 = result2.queryByText(loadingMessages_1.LoadingMessages.CreateCommunity);
        expect(switchLink2).toBeNull();
    }));
});
