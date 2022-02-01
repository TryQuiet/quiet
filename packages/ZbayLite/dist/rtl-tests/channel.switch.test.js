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
const socket_io_mock_1 = __importDefault(require("socket.io-mock"));
const setupTests_1 = require("../shared/setupTests");
const renderComponent_1 = require("../renderer/testUtils/renderComponent");
const prepareStore_1 = require("../renderer/testUtils/prepareStore");
const Sidebar_1 = __importDefault(require("../renderer/components/widgets/sidebar/Sidebar"));
const Channel_1 = __importDefault(require("../renderer/containers/pages/Channel"));
const nectar_1 = require("@zbayapp/nectar");
const luxon_1 = require("luxon");
describe('Switch channels', () => {
    let socket;
    beforeEach(() => {
        socket = new socket_io_mock_1.default();
        setupTests_1.ioMock.mockImplementation(() => socket);
    });
    it('Opens another channel', () => __awaiter(void 0, void 0, void 0, function* () {
        const { store } = yield (0, prepareStore_1.prepareStore)({}, socket // Fork Nectar's sagas
        );
        const factory = yield (0, nectar_1.getFactory)(store);
        const community = yield factory.create('Community');
        const alice = yield factory.create('Identity', { id: community.id, zbayNickname: 'alice' });
        const generalChannelMessage = yield factory.create('Message', { identity: alice, verifyAutomatically: true });
        yield factory.create('PublicChannel', {
            communityId: community.id,
            channel: {
                name: 'memes',
                description: 'Welcome to #memes',
                timestamp: luxon_1.DateTime.utc().valueOf(),
                owner: alice.zbayNickname,
                address: 'memes'
            }
        });
        (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(Sidebar_1.default, null),
            react_1.default.createElement(Channel_1.default, null)), store);
        // Check if defaultly selected channel is #general
        const channelTitle = dom_1.screen.getByTestId('channelTitle');
        expect(channelTitle).toHaveTextContent('#general');
        // Check if message is visible within the channel page
        let message = dom_1.screen.getByText(generalChannelMessage.message.message);
        expect(message).toBeVisible();
        // Select another channel
        const memesChannelLink = dom_1.screen.getByTestId('memes-link');
        user_event_1.default.click(memesChannelLink);
        // Confirm selected channel has changed
        expect(channelTitle).toHaveTextContent('#memes');
        // Confirm the message from #general channel is no longer visible
        expect(message).not.toBeVisible();
        // Go back to #general channel
        const generalChannelLink = dom_1.screen.getByTestId('general-link');
        user_event_1.default.click(generalChannelLink);
        // Confirm selected channel has changed
        expect(channelTitle).toHaveTextContent('#general');
        // Confirm the message from #general channel is visible back again
        message = dom_1.screen.getByText(generalChannelMessage.message.message);
        expect(message).toBeVisible();
    }));
});
