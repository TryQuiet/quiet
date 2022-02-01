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
const user_event_1 = __importDefault(require("@testing-library/user-event"));
const dom_1 = require("@testing-library/dom");
const test_utils_1 = require("react-dom/test-utils");
const typed_redux_saga_1 = require("typed-redux-saga");
const socket_io_mock_1 = __importDefault(require("socket.io-mock"));
const setupTests_1 = require("../shared/setupTests");
const renderComponent_1 = require("../renderer/testUtils/renderComponent");
const prepareStore_1 = require("../renderer/testUtils/prepareStore");
const store_keys_1 = require("../renderer/store/store.keys");
const Sidebar_1 = __importDefault(require("../renderer/components/widgets/sidebar/Sidebar"));
const CreateChannel_1 = __importDefault(require("../renderer/containers/widgets/channels/CreateChannel"));
const Channel_1 = __importDefault(require("../renderer/containers/pages/Channel"));
const nectar_1 = require("@zbayapp/nectar");
const modals_slice_1 = require("../renderer/sagas/modals/modals.slice");
const modals_types_1 = require("../renderer/sagas/modals/modals.types");
describe('Add new channel', () => {
    let socket;
    beforeEach(() => {
        socket = new socket_io_mock_1.default();
        setupTests_1.ioMock.mockImplementation(() => socket);
    });
    it('Opens modal on button click', () => __awaiter(void 0, void 0, void 0, function* () {
        const { store } = yield (0, prepareStore_1.prepareStore)({}, socket // Fork Nectar's sagas
        );
        const factory = yield (0, nectar_1.getFactory)(store);
        yield factory.create('Identity', { zbayNickname: 'alice' });
        (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(Sidebar_1.default, null),
            react_1.default.createElement(CreateChannel_1.default, null)), store);
        const addChannel = dom_1.screen.getByTestId('addChannelButton');
        user_event_1.default.click(addChannel);
        const title = yield dom_1.screen.findByText('Create a new public channel');
        expect(title).toBeVisible();
    }));
    it('Adds new channel and opens it', () => __awaiter(void 0, void 0, void 0, function* () {
        const { store, runSaga } = yield (0, prepareStore_1.prepareStore)({
            [store_keys_1.StoreKeys.Modals]: Object.assign(Object.assign({}, new modals_slice_1.ModalsInitialState()), { [modals_types_1.ModalName.createChannel]: { open: true } })
        }, socket // Fork Nectar's sagas
        );
        const factory = yield (0, nectar_1.getFactory)(store);
        const alice = yield factory.create('Identity', { zbayNickname: 'alice' });
        jest
            .spyOn(socket, 'emit')
            .mockImplementation((action, ...input) => __awaiter(void 0, void 0, void 0, function* () {
            if (action === nectar_1.SocketActionTypes.SUBSCRIBE_TO_TOPIC) {
                const data = input;
                const payload = data[0];
                expect(payload.peerId).toEqual(alice.peerId.id);
                expect(payload.channelData.name).toEqual('my-super-channel');
                return socket.socketClient.emit(nectar_1.SocketActionTypes.CREATED_CHANNEL, {
                    channel: payload.channelData,
                    communityId: alice.id // Identity id is the same as community id
                });
            }
        }));
        (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(Sidebar_1.default, null),
            react_1.default.createElement(CreateChannel_1.default, null),
            react_1.default.createElement(Channel_1.default, null)), store);
        const input = dom_1.screen.getByPlaceholderText('Enter a channel name');
        user_event_1.default.type(input, 'my Super Channel');
        // Check if parsed channel name displays properly
        const info = dom_1.screen.getByText('#my-super-channel');
        expect(info).toBeVisible();
        const button = dom_1.screen.getByText('Create Channel');
        user_event_1.default.click(button);
        yield (0, test_utils_1.act)(() => __awaiter(void 0, void 0, void 0, function* () {
            yield runSaga(testCreateChannelSaga).toPromise();
        }));
        function* testCreateChannelSaga() {
            const createChannelAction = yield* (0, typed_redux_saga_1.take)(nectar_1.publicChannels.actions.createChannel);
            expect(createChannelAction.payload.channel.name).toEqual('my-super-channel');
            expect(createChannelAction.payload.channel.owner).toEqual(alice.zbayNickname);
            const addChannelAction = yield* (0, typed_redux_saga_1.take)(nectar_1.publicChannels.actions.addChannel);
            expect(addChannelAction.payload.channel).toEqual(createChannelAction.payload.channel);
        }
        const createChannelModal = dom_1.screen.queryByTestId('createChannelModal');
        expect(createChannelModal).toBeNull();
        // Check if newly created channel is present and selected
        const channelTitle = dom_1.screen.getByTestId('channelTitle');
        expect(channelTitle).toHaveTextContent('#my-super-channel');
        // Check if sidebar item displays as selected
        const link = dom_1.screen.getByTestId('my-super-channel-link');
        expect(link).toHaveClass('makeStyles-selected-539');
    }));
});
