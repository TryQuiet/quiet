"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint import/first: 0 */
const create_1 = __importDefault(require("../create"));
const whitelist_1 = __importDefault(require("./whitelist"));
describe('users selectors', () => {
    let store = null;
    beforeEach(() => {
        store = (0, create_1.default)({
            whitelist: {
                allowAll: false,
                whitelisted: ['test1', 'test2'],
                autoload: ['test3', 'test4']
            }
        });
        jest.clearAllMocks();
    });
    it(' - allowAll', () => {
        expect(whitelist_1.default.allowAll(store.getState())).toMatchSnapshot();
    });
    it(' - whitelisted', () => {
        expect(whitelist_1.default.whitelisted(store.getState())).toMatchSnapshot();
    });
    it(' - autoload', () => {
        expect(whitelist_1.default.autoload(store.getState())).toMatchSnapshot();
    });
});
