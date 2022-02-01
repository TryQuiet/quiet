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
exports.ioMock = void 0;
const enzyme_1 = __importDefault(require("enzyme"));
const enzyme_adapter_react_16_1 = __importDefault(require("enzyme-adapter-react-16"));
const register_1 = __importDefault(require("babel-plugin-require-context-hook/register"));
const redux_persist_memory_storage_1 = __importDefault(require("redux-persist-memory-storage"));
const pkijs_1 = require("pkijs");
const webcrypto_1 = require("@peculiar/webcrypto");
const socket_io_client_1 = require("socket.io-client");
const webcrypto = new webcrypto_1.Crypto();
(0, pkijs_1.setEngine)('newEngine', webcrypto, new pkijs_1.CryptoEngine({
    name: '',
    crypto: webcrypto,
    subtle: webcrypto.subtle
}));
global.crypto = webcrypto;
jest.mock('socket.io-client', () => ({
    io: jest.fn()
}));
exports.ioMock = socket_io_client_1.io;
jest.mock('electron-store-webpack-wrapper');
jest.mock('./electronStore', () => ({
    get: () => { },
    set: () => { }
}));
jest.mock('electron', () => {
    return { ipcRenderer: { on: () => { }, send: jest.fn() } };
});
// eslint-disable-next-line new-cap
jest.mock('redux-persist-electron-storage', () => () => new redux_persist_memory_storage_1.default());
jest.mock('react-jdenticon', () => () => 'Jdenticon');
// eslint-disable-next-line
const mockFetch = () => __awaiter(void 0, void 0, void 0, function* () { return yield Promise.resolve({}); });
global.fetch = mockFetch;
(0, register_1.default)();
process.env.ZBAY_IS_TESTNET = '1';
enzyme_1.default.configure({ adapter: new enzyme_adapter_react_16_1.default() });
jest.resetAllMocks();
