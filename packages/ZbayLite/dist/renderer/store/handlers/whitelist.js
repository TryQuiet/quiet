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
exports.reducer = exports.epics = exports.removeSiteHost = exports.removeImageHost = exports.setAutoLoad = exports.setWhitelistAll = exports.addToWhitelist = exports.initWhitelist = exports.actions = exports.initialState = void 0;
const immer_1 = require("immer");
const redux_actions_1 = require("redux-actions");
const static_1 = require("../../../shared/static");
const electronStore_1 = __importDefault(require("../../../shared/electronStore"));
// TODO: Move to settings section in store
class Whitelist {
    constructor(values) {
        Object.assign(this, values);
        this[immer_1.immerable] = true;
    }
}
exports.initialState = Object.assign({}, new Whitelist({
    allowAll: false,
    whitelisted: [],
    autoload: []
}));
const setWhitelist = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_WHITELIST);
const setWhitelistAllFlag = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_WHITELIST_ALL_FLAG);
const setAutoLoadList = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_AUTO_LOAD_LIST);
exports.actions = {
    setWhitelist,
    setWhitelistAllFlag,
    setAutoLoadList
};
const ensureStore = () => {
    if (!electronStore_1.default.get('whitelist')) {
        electronStore_1.default.set('whitelist', {
            allowAll: false,
            whitelisted: [],
            autoload: []
        });
    }
};
const initWhitelist = () => (dispatch) => __awaiter(void 0, void 0, void 0, function* () {
    ensureStore();
    const whitelist = electronStore_1.default.get('whitelist');
    dispatch(setWhitelist(whitelist.whitelisted));
    dispatch(setWhitelistAllFlag(whitelist.allowAll));
    dispatch(setAutoLoadList(whitelist.autoload));
});
exports.initWhitelist = initWhitelist;
const addToWhitelist = (url, dontAutoload) => (dispatch) => __awaiter(void 0, void 0, void 0, function* () {
    ensureStore();
    const whitelistArray = electronStore_1.default.get('whitelist.whitelisted');
    const uri = new URL(url);
    if (whitelistArray.indexOf(uri.hostname) === -1) {
        whitelistArray.push(uri.hostname);
    }
    electronStore_1.default.set('whitelist.whitelisted', whitelistArray);
    if (!dontAutoload) {
        dispatch((0, exports.setAutoLoad)(uri.hostname));
    }
    dispatch(setWhitelist(whitelistArray));
});
exports.addToWhitelist = addToWhitelist;
const setWhitelistAll = allowAll => (dispatch) => __awaiter(void 0, void 0, void 0, function* () {
    ensureStore();
    electronStore_1.default.set('whitelist.allowAll', allowAll);
    dispatch(setWhitelistAllFlag(allowAll));
});
exports.setWhitelistAll = setWhitelistAll;
const setAutoLoad = newLink => (dispatch) => __awaiter(void 0, void 0, void 0, function* () {
    ensureStore();
    const autoloadArray = electronStore_1.default.get('whitelist.autoload');
    if (autoloadArray.indexOf(newLink) === -1) {
        autoloadArray.push(newLink);
    }
    electronStore_1.default.set('whitelist.autoload', autoloadArray);
    dispatch(setAutoLoadList(autoloadArray));
});
exports.setAutoLoad = setAutoLoad;
const removeImageHost = hostname => (dispatch) => __awaiter(void 0, void 0, void 0, function* () {
    ensureStore();
    const autoloadArray = electronStore_1.default.get('whitelist.autoload');
    const filteredArray = autoloadArray.filter(name => name !== hostname);
    electronStore_1.default.set('whitelist.autoload', filteredArray);
    dispatch(setAutoLoadList(filteredArray));
});
exports.removeImageHost = removeImageHost;
const removeSiteHost = hostname => (dispatch) => __awaiter(void 0, void 0, void 0, function* () {
    ensureStore();
    const whitelistedArray = electronStore_1.default.get('whitelist.whitelisted');
    const filteredArray = whitelistedArray.filter(name => name !== hostname);
    electronStore_1.default.set('whitelist.whitelisted', filteredArray);
    dispatch(setWhitelist(filteredArray));
});
exports.removeSiteHost = removeSiteHost;
exports.epics = {
    addToWhitelist: exports.addToWhitelist,
    setWhitelistAll: exports.setWhitelistAll,
    setAutoLoad: exports.setAutoLoad,
    initWhitelist: exports.initWhitelist,
    removeImageHost: exports.removeImageHost,
    removeSiteHost: exports.removeSiteHost
};
exports.reducer = (0, redux_actions_1.handleActions)({
    [setWhitelist.toString()]: (state, { payload: list }) => (0, immer_1.produce)(state, draft => {
        draft.whitelisted = list;
    }),
    [setAutoLoadList.toString()]: (state, { payload: list }) => (0, immer_1.produce)(state, draft => {
        draft.autoload = list;
    }),
    [setWhitelistAllFlag.toString()]: (state, { payload: flag }) => (0, immer_1.produce)(state, draft => {
        draft.allowAll = flag;
    })
}, exports.initialState);
exports.default = {
    actions: exports.actions,
    reducer: exports.reducer,
    epics: exports.epics
};
