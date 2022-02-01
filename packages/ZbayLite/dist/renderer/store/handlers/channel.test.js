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
const luxon_1 = require("luxon");
const create_1 = __importDefault(require("../create"));
const channel_1 = require("./channel");
const channel_2 = __importDefault(require("../selectors/channel"));
describe('channel reducer', () => {
    const identityId = 'test-identity-id';
    const address = 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya';
    let store = null;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // window.Notification = jest.fn()
        store = (0, create_1.default)({
            channel: Object.assign({}, channel_1.ChannelState),
            identity: {
                data: {
                    id: identityId,
                    address,
                    name: 'Saturn',
                    balance: '33.583004',
                    signerPrivKey: '879aff43df53606d8ae1219d9347360e7a30d1c2f141e14c9bc96bb29bf930cb'
                }
            },
            operations: {}
        });
        jest.spyOn(luxon_1.DateTime, 'utc').mockImplementation(() => luxon_1.DateTime.utc(2019, 3, 7, 13, 3, 48));
        jest.clearAllMocks();
    }));
    describe('handles actions', () => {
        it(' - setMessage', () => {
            const msg = 'this is a test message';
            const id = '1';
            store.dispatch(channel_1.actions.setChannelId(id));
            store.dispatch(channel_1.actions.setMessage({ value: msg, id }));
            const result = channel_2.default.message(store.getState());
            expect(result).toEqual(msg);
        });
    });
});
