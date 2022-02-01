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
const directMessageChannel_1 = require("./directMessageChannel");
const directMessageChannel_2 = __importDefault(require("../selectors/directMessageChannel"));
describe('directMessageChannel reducer', () => {
    let store = null;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        store = (0, create_1.default)({});
    }));
    describe('handles actions', () => {
        it('- setTargetRecipientAddress', () => {
            store.dispatch(directMessageChannel_1.actions.setDirectMessageRecipientAddress('target-user-address'));
            const channel = directMessageChannel_2.default.directMessageChannel(store.getState());
            expect(channel).toMatchSnapshot();
        });
        it('- setTargetRecipientUsername', () => {
            store.dispatch(directMessageChannel_1.actions.setDirectMessageRecipientUsername('target-user-username'));
            const channel = directMessageChannel_2.default.directMessageChannel(store.getState());
            expect(channel).toMatchSnapshot();
        });
    });
});
