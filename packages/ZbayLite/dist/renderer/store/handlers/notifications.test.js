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
const notifications_1 = require("./notifications");
const notifications_2 = __importDefault(require("../selectors/notifications"));
describe('notifications reducer handles', () => {
    let store = null;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        store = (0, create_1.default)({
            notifications: []
        });
        jest.clearAllMocks();
    }));
    describe('action', () => {
        it('enqueueSnackbar', () => {
            store.dispatch(notifications_1.actions.enqueueSnackbar({
                message: 'This is a sample message',
                options: {
                    persistent: true
                }
            }));
            const notifications = notifications_2.default.data(store.getState());
            expect.assertions(notifications.length * 2);
            // Test if generates ids and remove them for snapshot
            const withoutKeys = notifications.map(n => {
                const temp = Object.assign({}, n);
                delete temp.key;
                expect(typeof n.key).toEqual('string');
                return Object.assign({}, temp);
            });
            expect(withoutKeys).toMatchSnapshot();
        });
        it('removeSnackbar', () => {
            const { payload } = store.dispatch(notifications_1.actions.enqueueSnackbar({
                message: 'This is a sample message',
                options: {
                    persistent: true
                }
            }));
            store.dispatch(notifications_1.actions.removeSnackbar(payload.key));
            const notifications = notifications_2.default.data(store.getState());
            expect(notifications).toMatchSnapshot();
        });
    });
});
