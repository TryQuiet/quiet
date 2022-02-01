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
const mentions_1 = __importDefault(require("./mentions"));
const mentions_2 = require("../handlers/mentions");
const create_1 = __importDefault(require("../create"));
const channelId1 = ' id1';
const channelId2 = ' id2';
describe('invitation -', () => {
    let store = null;
    beforeEach(() => {
        jest.clearAllMocks();
        store = (0, create_1.default)({
            mentions: {
                [channelId1]: [
                    Object.assign(Object.assign({}, mentions_2.ChannelMentions), { nickname: 'test1', timeStamp: 1234567 }),
                    Object.assign(Object.assign({}, mentions_2.ChannelMentions), { nickname: 'test2', timeStamp: 1234567 })
                ],
                [channelId2]: [
                    Object.assign(Object.assign({}, mentions_2.ChannelMentions), { nickname: 'test3', timeStamp: 1234567 }),
                    Object.assign(Object.assign({}, mentions_2.ChannelMentions), { nickname: 'test4', timeStamp: 1234567 })
                ]
            }
        });
    });
    it('mentions selector', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(mentions_1.default.mentions(store.getState())).toMatchSnapshot();
    }));
    it('mentions selector channel 1', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(mentions_1.default.mentionForChannel(channelId1)(store.getState())).toMatchSnapshot();
    }));
    it('mentions selector channel 2', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(mentions_1.default.mentionForChannel(channelId1)(store.getState())).toMatchSnapshot();
    }));
});
