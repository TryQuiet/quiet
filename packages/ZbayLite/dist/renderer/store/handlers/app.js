"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reducer = exports.actions = exports.initialState = exports.App = void 0;
const immer_1 = require("immer");
const electron_1 = require("electron");
const redux_actions_1 = require("redux-actions");
const static_1 = require("../../../shared/static");
class App {
    constructor(values) {
        Object.assign(this, values);
        this[immer_1.immerable] = true;
    }
}
exports.App = App;
exports.initialState = Object.assign({}, new App({
    version: null,
    newUser: false,
    modalTabToOpen: 'notifications',
    isInitialLoadFinished: false
}));
const loadVersion = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_APP_VERSION, () => electron_1.remote.app.getVersion());
const setModalTab = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_CURRENT_MODAL_TAB);
const clearModalTab = (0, redux_actions_1.createAction)(static_1.actionTypes.CLEAR_CURRENT_MODAL_TAB);
exports.actions = {
    loadVersion,
    setModalTab,
    clearModalTab
};
exports.reducer = (0, redux_actions_1.handleActions)({
    [loadVersion.toString()]: (state, { payload: version }) => (0, immer_1.produce)(state, draft => {
        draft.version = version;
    }),
    [setModalTab.toString()]: (state, { payload: tabName }) => (0, immer_1.produce)(state, draft => {
        draft.modalTabToOpen = tabName;
    }),
    [clearModalTab.toString()]: state => (0, immer_1.produce)(state, draft => {
        draft.modalTabToOpen = null;
    })
}, exports.initialState);
exports.default = {
    actions: exports.actions,
    reducer: exports.reducer
};
