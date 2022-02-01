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
/* eslint import/first: 0 */
const create_1 = __importDefault(require("../create"));
const notificationCenter_1 = require("./notificationCenter");
const notificationCenter_2 = __importDefault(require("../selectors/notificationCenter"));
const static_1 = require("../../../shared/static");
describe('notifications reducer handles', () => {
    let store = null;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        store = (0, create_1.default)({
            initialState: {
                notificationCenter: Object.assign({}, notificationCenter_1.initialState)
            }
        });
        jest.clearAllMocks();
    }));
    describe('action', () => {
        it('set channel filter', () => {
            const channelId = 'testid';
            const notificationsBefore = notificationCenter_2.default.channelFilterById(channelId)(store.getState());
            expect(notificationsBefore).toEqual(static_1.notificationFilterType.ALL_MESSAGES);
            store.dispatch(notificationCenter_1.actions.setChannelNotificationFilter({
                channelId: channelId,
                filterType: static_1.notificationFilterType.MENTIONS
            }));
            const notificationsAfter = notificationCenter_2.default.channelFilterById(channelId)(store.getState());
            expect(notificationsAfter).toEqual(static_1.notificationFilterType.MENTIONS);
        });
        it('set contact filter', () => {
            const contactAddress = 'address';
            const notificationsBefore = notificationCenter_2.default.contactFilterByAddress(contactAddress)(store.getState());
            expect(notificationsBefore).toEqual(static_1.notificationFilterType.ALL_MESSAGES);
            store.dispatch(notificationCenter_1.actions.setContactNotificationFilter({
                contact: contactAddress,
                filterType: static_1.notificationFilterType.MENTIONS
            }));
            const notificationsAfter = notificationCenter_2.default.contactFilterByAddress(contactAddress)(store.getState());
            expect(notificationsAfter).toEqual(static_1.notificationFilterType.MENTIONS);
        });
        it('set user filter', () => {
            const notificationsBefore = notificationCenter_2.default.userFilterType(store.getState());
            expect(notificationsBefore).toEqual(static_1.notificationFilterType.ALL_MESSAGES);
            store.dispatch(notificationCenter_1.actions.setUserNotificationFilter({
                filterType: static_1.notificationFilterType.MENTIONS
            }));
            const notificationsAfter = notificationCenter_2.default.userFilterType(store.getState());
            expect(notificationsAfter).toEqual(static_1.notificationFilterType.MENTIONS);
        });
    });
});
