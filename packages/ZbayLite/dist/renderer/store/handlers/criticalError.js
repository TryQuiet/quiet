"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reducer = exports.actions = exports.initialState = void 0;
const immer_1 = require("immer");
const redux_actions_1 = require("redux-actions");
const static_1 = require("../../../shared/static");
class CriticalError {
    constructor(values) {
        Object.assign(this, values);
        this[immer_1.immerable] = true;
    }
}
exports.initialState = Object.assign({}, new CriticalError({
    message: '',
    traceback: ''
}));
const setCriticalError = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_CRITICAL_ERROR);
exports.actions = {
    setCriticalError
};
exports.reducer = (0, redux_actions_1.handleActions)({
    [setCriticalError.toString()]: (state, { payload: error }) => (0, immer_1.produce)(state, draft => {
        return Object.assign(Object.assign({}, draft), error);
    })
}, exports.initialState);
exports.default = {
    actions: exports.actions,
    reducer: exports.reducer
};
