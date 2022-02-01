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
const criticalError_1 = __importDefault(require("./criticalError"));
const create_1 = __importDefault(require("../create"));
describe('criticalError -', () => {
    let store = null;
    beforeEach(() => {
        jest.clearAllMocks();
        store = (0, create_1.default)({
            criticalError: {
                message: 'Some kind of error',
                traceback: 'Error: Traceback for Some kind of error'
            }
        });
    });
    it('criticalError selector', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(criticalError_1.default.criticalError(store.getState())).toMatchSnapshot();
    }));
    it('message selector', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(criticalError_1.default.message(store.getState())).toMatchSnapshot();
    }));
    it('traceback selector', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(criticalError_1.default.traceback(store.getState())).toMatchSnapshot();
    }));
});
