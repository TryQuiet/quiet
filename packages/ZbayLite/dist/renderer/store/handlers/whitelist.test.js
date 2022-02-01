"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const create_1 = __importDefault(require("../create"));
const whitelist_1 = __importStar(require("./whitelist"));
const whitelist_2 = __importDefault(require("../selectors/whitelist"));
describe('Operations reducer handles ', () => {
    let store = null;
    beforeEach(() => {
        store = (0, create_1.default)({
            initialState: {
                whitelist: whitelist_1.initialState
            }
        });
        jest.clearAllMocks();
    });
    describe('actions', () => {
        it('- setWhitelistAllFlag', () => {
            store.dispatch(whitelist_1.default.actions.setWhitelistAllFlag(true));
            expect(whitelist_2.default.allowAll(store.getState())).toEqual(true);
            store.dispatch(whitelist_1.default.actions.setWhitelistAllFlag(false));
            expect(whitelist_2.default.allowAll(store.getState())).toEqual(false);
        });
        it('- setWhitelist', () => {
            const whitelist = ['test1', 'test2'];
            store.dispatch(whitelist_1.default.actions.setWhitelist(whitelist));
            expect(whitelist_2.default.whitelisted(store.getState())).toEqual(whitelist);
            const whitelist2 = ['test1', 'test2', 'test4'];
            store.dispatch(whitelist_1.default.actions.setWhitelist(whitelist2));
            expect(whitelist_2.default.whitelisted(store.getState())).toEqual(whitelist2);
        });
        it('- setAutoLoadList', () => {
            const autoload = ['test1', 'test2'];
            store.dispatch(whitelist_1.default.actions.setAutoLoadList(autoload));
            expect(whitelist_2.default.autoload(store.getState())).toEqual(autoload);
            const autoload2 = ['test1', 'test2', 'test4'];
            store.dispatch(whitelist_1.default.actions.setAutoLoadList(autoload2));
            expect(whitelist_2.default.autoload(store.getState())).toEqual(autoload2);
        });
    });
});
