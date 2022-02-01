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
const directMessageChannel_1 = __importDefault(require("./directMessageChannel"));
const create_1 = __importDefault(require("../create"));
const storeState = {
    directMessageChannel: {
        targetRecipientAddress: 'test-address',
        targetRecipientUsername: 'test-username'
    }
};
describe('directMessageChannel selector', () => {
    let store = null;
    beforeEach(() => {
        jest.clearAllMocks();
        store = (0, create_1.default)(Object.assign({}, storeState));
    });
    it('channel data selector', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(directMessageChannel_1.default.directMessageChannel(store.getState())).toMatchSnapshot();
    }));
});
