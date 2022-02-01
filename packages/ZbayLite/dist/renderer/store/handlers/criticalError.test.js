"use strict";
/* eslint import/first: 0 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const criticalError_1 = __importDefault(require("./criticalError"));
const criticalError_2 = __importDefault(require("../selectors/criticalError"));
const create_1 = __importDefault(require("../create"));
describe('criticalError reducer', () => {
    let store = null;
    beforeEach(() => {
        store = (0, create_1.default)();
        jest.clearAllMocks();
    });
    describe('handles actions -', () => {
        it('setCriticalError', () => {
            store.dispatch(criticalError_1.default.actions.setCriticalError({
                message: 'This is an error',
                traceback: 'Error: This is an error'
            }));
            expect(criticalError_2.default.criticalError(store.getState())).toMatchSnapshot();
        });
    });
});
