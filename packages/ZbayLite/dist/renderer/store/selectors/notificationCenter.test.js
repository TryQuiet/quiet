"use strict";
/* eslint import/first: 0 */
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
const notificationCenter_1 = __importDefault(require("./notificationCenter"));
const notificationCenter_2 = require("../handlers/notificationCenter");
const create_1 = __importDefault(require("../create"));
describe('NotificationsCenter', () => {
    let store = null;
    beforeEach(() => {
        jest.clearAllMocks();
        store = (0, create_1.default)({
            notificationCenter: Object.assign(Object.assign({}, notificationCenter_2.initialState), { channels: { key1: 1, key2: 2 }, user: { key1: 1, key2: 2, filterType: 1, sound: 1 }, contacts: { key1: 1, key2: 2, muted1: 4, muted2: 4 } })
        });
    });
    it('channels selector', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(notificationCenter_1.default.channels(store.getState())).toMatchSnapshot();
    }));
    it('channel by id selector', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(notificationCenter_1.default.channelFilterById('key1')(store.getState())).toMatchSnapshot();
    }));
    it('contacts selector', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(notificationCenter_1.default.contacts(store.getState())).toMatchSnapshot();
    }));
    it('blockedUsers selector', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(notificationCenter_1.default.blockedUsers(store.getState())).toMatchSnapshot();
    }));
    it('contact by address selector', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(notificationCenter_1.default.contactFilterByAddress('key1')(store.getState())).toMatchSnapshot();
    }));
    it('user selector', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(notificationCenter_1.default.user(store.getState())).toMatchSnapshot();
    }));
    it('user filterType selector', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(notificationCenter_1.default.userFilterType(store.getState())).toMatchSnapshot();
    }));
    it('user sound selector', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(notificationCenter_1.default.userSound(store.getState())).toMatchSnapshot();
    }));
});
