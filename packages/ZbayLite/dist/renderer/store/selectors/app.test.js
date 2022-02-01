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
const app_1 = __importDefault(require("./app"));
const app_2 = require("../handlers/app");
const create_1 = __importDefault(require("../create"));
describe('app -', () => {
    let store = null;
    beforeEach(() => {
        jest.clearAllMocks();
        store = (0, create_1.default)({
            app: Object.assign(Object.assign({}, app_2.initialState), { version: '0.13.37', transfers: {}, modalTabToOpen: 'addFunds', allTransfersCount: 12, newTransfersCounter: 2 })
        });
    });
    it('version selector', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(app_1.default.version(store.getState())).toMatchSnapshot();
    }));
    it('modal tab to open', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(app_1.default.currentModalTab(store.getState())).toMatchSnapshot();
    }));
    it('isInitialLoadFinished', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(app_1.default.isInitialLoadFinished(store.getState())).toMatchSnapshot();
    }));
});
