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
exports.reducers = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const redux_persist_electron_storage_1 = __importDefault(require("redux-persist-electron-storage"));
const redux_persist_1 = require("redux-persist");
const store_keys_1 = require("./store.keys");
const nectar_1 = __importStar(require("@zbayapp/nectar"));
const socket_slice_1 = require("../sagas/socket/socket.slice");
const modals_slice_1 = require("../sagas/modals/modals.slice");
const app_1 = __importDefault(require("./handlers/app"));
const waggle_1 = __importDefault(require("./handlers/waggle"));
const contacts_1 = __importDefault(require("./handlers/contacts"));
const channel_1 = __importDefault(require("./handlers/channel"));
const directMessages_1 = __importDefault(require("./handlers/directMessages"));
const directMessageChannel_1 = __importDefault(require("./handlers/directMessageChannel"));
const notifications_1 = __importDefault(require("./handlers/notifications"));
const notificationCenter_1 = __importDefault(require("./handlers/notificationCenter"));
const mentions_1 = __importDefault(require("./handlers/mentions"));
const criticalError_1 = __importDefault(require("./handlers/criticalError"));
const whitelist_1 = __importDefault(require("./handlers/whitelist"));
const reduxStorage = (0, redux_persist_electron_storage_1.default)();
const persistConfig = {
    key: 'root',
    storage: reduxStorage,
    throttle: 1000,
    whitelist: [
        nectar_1.storeKeys.Identity,
        nectar_1.storeKeys.Communities,
        nectar_1.storeKeys.PublicChannels,
        store_keys_1.StoreKeys.App,
        store_keys_1.StoreKeys.Contacts,
        store_keys_1.StoreKeys.DirectMessages,
        store_keys_1.StoreKeys.Whitelist
    ]
};
exports.reducers = Object.assign(Object.assign({}, nectar_1.default.reducers), { [store_keys_1.StoreKeys.App]: app_1.default.reducer, [store_keys_1.StoreKeys.Socket]: socket_slice_1.socketReducer, [store_keys_1.StoreKeys.Waggle]: waggle_1.default.reducer, [store_keys_1.StoreKeys.Modals]: modals_slice_1.modalsReducer, [store_keys_1.StoreKeys.DirectMessages]: directMessages_1.default.reducer, [store_keys_1.StoreKeys.DirectMessageChannel]: directMessageChannel_1.default.reducer, [store_keys_1.StoreKeys.Notifications]: notifications_1.default.reducer, [store_keys_1.StoreKeys.NotificationCenter]: notificationCenter_1.default.reducer, [store_keys_1.StoreKeys.Channel]: channel_1.default.reducer, [store_keys_1.StoreKeys.Contacts]: contacts_1.default.reducer, [store_keys_1.StoreKeys.Mentions]: mentions_1.default.reducer, [store_keys_1.StoreKeys.Whitelist]: whitelist_1.default.reducer, [store_keys_1.StoreKeys.CriticalError]: criticalError_1.default.reducer });
exports.default = (0, redux_persist_1.persistReducer)(persistConfig, (0, toolkit_1.combineReducers)(exports.reducers));
