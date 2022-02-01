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
const react_1 = __importDefault(require("react"));
const react_dom_1 = require("react-dom");
const electron_1 = require("electron");
const Root_1 = __importDefault(require("./Root"));
const store_1 = __importDefault(require("./store"));
const update_1 = __importDefault(require("./store/handlers/update"));
const waggle_1 = __importDefault(require("./store/handlers/waggle"));
const debug_1 = __importDefault(require("debug"));
const Sentry = __importStar(require("@sentry/react"));
const tracing_1 = require("@sentry/tracing");
const socket_slice_1 = require("./sagas/socket/socket.slice");
if (process.env.REACT_APP_ENABLE_SENTRY === 'true') {
    Sentry.init({
        dsn: 'https://1ca88607c3d14e15b36cb2cfd5f16d68@o1060867.ingest.sentry.io/6050774',
        integrations: [new tracing_1.Integrations.BrowserTracing()],
        // Set tracesSampleRate to 1.0 to capture 100%
        // of transactions for performance monitoring.
        // We recommend adjusting this value in production
        tracesSampleRate: 1.0
    });
}
const log = Object.assign((0, debug_1.default)('zbay:renderer'), {
    error: (0, debug_1.default)('zbay:renderer:err')
});
if (window) {
    window.localStorage.setItem('debug', process.env.DEBUG);
}
electron_1.ipcRenderer.send('start-waggle');
electron_1.ipcRenderer.on('newUpdateAvailable', (_event) => {
    store_1.default.dispatch(update_1.default.epics.checkForUpdate());
});
electron_1.ipcRenderer.on('connectToWebsocket', (_event, payload) => {
    store_1.default.dispatch(socket_slice_1.socketActions.startConnection(payload));
});
electron_1.ipcRenderer.on('waggleInitialized', (_event) => {
    log('waggle initialized');
    store_1.default.dispatch(waggle_1.default.actions.setIsWaggleConnected(true));
});
(0, react_dom_1.render)(react_1.default.createElement(Root_1.default, null), document.getElementById('root'));
if (module.hot) {
    module.hot.accept();
}
