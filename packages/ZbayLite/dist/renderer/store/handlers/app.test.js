"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint import/first: 0 */
jest.mock('electron', () => {
    // @ts-expect-error
    const remote = jest.mock();
    // @ts-expect-error
    const ipcRenderer = jest.mock();
    // @ts-expect-error
    remote.app = jest.mock();
    // @ts-expect-error
    remote.process = jest.mock();
    // @ts-expect-error
    remote.process.on = jest.fn();
    // @ts-expect-error
    remote.app.getVersion = jest.fn().mockReturnValue('0.13.37');
    // @ts-expect-error
    ipcRenderer.on = jest.fn().mockReturnValue('ok');
    return { remote, ipcRenderer };
});
const electron_1 = require("electron");
const app_1 = __importDefault(require("./app"));
const app_2 = __importDefault(require("../selectors/app"));
const create_1 = __importDefault(require("../create"));
describe('criticalError reducer', () => {
    let store = null;
    beforeEach(() => {
        store = (0, create_1.default)({
            initialState: {
                app: {
                // ...AppState
                }
            }
        });
        // @ts-expect-error
        electron_1.remote.app = jest.mock();
        jest.clearAllMocks();
    });
    describe('handles actions -', () => {
        it('loadVersion', () => {
            store.dispatch(app_1.default.actions.loadVersion());
            expect(app_2.default.version(store.getState())).toMatchSnapshot();
        });
    });
});
