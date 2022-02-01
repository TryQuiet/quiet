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
const renderComponent_1 = require("../renderer/testUtils/renderComponent");
const prepareStore_1 = require("../renderer/testUtils/prepareStore");
const store_keys_1 = require("../renderer/store/store.keys");
const socket_slice_1 = require("../renderer/sagas/socket/socket.slice");
const loadingPanel_1 = __importDefault(require("../renderer/containers/widgets/loadingPanel/loadingPanel"));
const joinCommunity_1 = __importDefault(require("../renderer/containers/widgets/joinCommunity/joinCommunity"));
const createCommunity_1 = __importDefault(require("../renderer/containers/widgets/createCommunity/createCommunity"));
const Channel_1 = __importDefault(require("../renderer/containers/pages/Channel"));
const PerformCommunityAction_dictionary_1 = require("../renderer/components/widgets/performCommunityAction/PerformCommunityAction.dictionary");
const socket_io_mock_1 = __importDefault(require("socket.io-mock"));
const setupTests_1 = require("../shared/setupTests");
const loadingMessages_1 = require("../renderer/containers/widgets/loadingPanel/loadingMessages");
const nectar_1 = require("@zbayapp/nectar");
describe('Restart app works correctly', () => {
    let socket;
    beforeEach(() => {
        socket = new socket_io_mock_1.default();
        setupTests_1.ioMock.mockImplementation(() => socket);
    });
    it('Displays channel component, not displays join/create community component', () => __awaiter(void 0, void 0, void 0, function* () {
        const { store } = yield (0, prepareStore_1.prepareStore)({
            [store_keys_1.StoreKeys.Socket]: Object.assign(Object.assign({}, new socket_slice_1.SocketState()), { isConnected: false })
        }, socket // Fork Nectar's sagas
        );
        const factory = yield (0, nectar_1.getFactory)(store);
        const community = yield factory.create('Community');
        yield factory.create('Identity', {
            id: community.id,
            zbayNickname: 'alice'
        });
        (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(loadingPanel_1.default, null),
            react_1.default.createElement(joinCommunity_1.default, null),
            react_1.default.createElement(createCommunity_1.default, null),
            react_1.default.createElement(Channel_1.default, null)), store);
        const channelName = yield dom_1.screen.findByText('#general');
        const joinDictionary = (0, PerformCommunityAction_dictionary_1.JoinCommunityDictionary)();
        const joinCommunityTitle = dom_1.screen.queryByText(joinDictionary.header);
        const createDictionary = (0, PerformCommunityAction_dictionary_1.CreateCommunityDictionary)();
        const createCommunityTitle = dom_1.screen.queryByText(createDictionary.header);
        const createCommunityLoadingText = dom_1.screen.queryByText(loadingMessages_1.LoadingMessages.CreateCommunity);
        const joinCommunityLoadingText = dom_1.screen.queryByText(loadingMessages_1.LoadingMessages.JoinCommunity);
        const startAppLoadingText = dom_1.screen.queryByText(loadingMessages_1.LoadingMessages.StartApp);
        expect(channelName).toBeVisible();
        expect(joinCommunityTitle).toBeNull();
        expect(createCommunityTitle).toBeNull();
        expect(createCommunityLoadingText).toBeNull();
        expect(joinCommunityLoadingText).toBeNull();
        expect(startAppLoadingText).toBeNull();
    }));
});
