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
const typed_redux_saga_1 = require("typed-redux-saga");
const renderComponent_1 = require("../renderer/testUtils/renderComponent");
const prepareStore_1 = require("../renderer/testUtils/prepareStore");
const socket_io_mock_1 = __importDefault(require("socket.io-mock"));
const setupTests_1 = require("../shared/setupTests");
const nectar_1 = require("@zbayapp/nectar");
const Channel_1 = __importDefault(require("../renderer/containers/pages/Channel"));
describe('General channel', () => {
    let socket;
    let communityId;
    beforeEach(() => {
        socket = new socket_io_mock_1.default();
        setupTests_1.ioMock.mockImplementation(() => socket);
    });
    it('create automatically along with creating community', () => __awaiter(void 0, void 0, void 0, function* () {
        const { store, runSaga } = yield (0, prepareStore_1.prepareStore)({}, socket // Fork Nectar's sagas
        );
        (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(Channel_1.default, null)), store);
        const factory = yield (0, nectar_1.getFactory)(store);
        yield factory.create('Identity', { zbayNickname: 'alice' });
        jest
            .spyOn(socket, 'emit')
            .mockImplementation((action, ...input) => __awaiter(void 0, void 0, void 0, function* () {
            if (action === nectar_1.SocketActionTypes.SUBSCRIBE_TO_TOPIC) {
                const data = input;
                const payload = data[0];
                expect(payload.channelData.name).toEqual('general');
            }
        }));
        yield (0, test_utils_1.act)(() => __awaiter(void 0, void 0, void 0, function* () {
            yield runSaga(testCreateGeneralChannelSaga).toPromise();
        }));
        function* mockNewCommunityEvent() {
            yield* (0, typed_redux_saga_1.apply)(socket.socketClient, socket.socketClient.emit, [
                nectar_1.SocketActionTypes.NEW_COMMUNITY,
                {
                    id: communityId
                }
            ]);
        }
        function* testCreateGeneralChannelSaga() {
            yield* (0, typed_redux_saga_1.fork)(mockNewCommunityEvent);
            yield* (0, typed_redux_saga_1.take)(nectar_1.publicChannels.actions.createChannel);
            yield* (0, typed_redux_saga_1.take)(nectar_1.publicChannels.actions.setCurrentChannel);
        }
    }));
});
