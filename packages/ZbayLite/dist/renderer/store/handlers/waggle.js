"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reducer = exports.epics = exports.actions = exports.initialState = exports.Waggle = void 0;
const static_1 = require("../../../shared/static");
const immer_1 = require("immer");
const toolkit_1 = require("@reduxjs/toolkit");
class Waggle {
    constructor(values) {
        Object.assign(this, values);
        this[immer_1.immerable] = true;
    }
}
exports.Waggle = Waggle;
exports.initialState = {
    isWaggleConnected: false
};
const setIsWaggleConnected = (0, toolkit_1.createAction)(static_1.actionTypes.SET_IS_WAGGLE_CONNECTED);
exports.actions = {
    setIsWaggleConnected
};
exports.epics = {};
exports.reducer = (0, toolkit_1.createReducer)(exports.initialState, (builder) => {
    builder.addCase(setIsWaggleConnected, (state, action) => {
        state.isWaggleConnected = action.payload;
    });
});
exports.default = {
    actions: exports.actions,
    epics: exports.epics,
    reducer: exports.reducer
};
