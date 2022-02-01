"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketSelectors = exports.isConnected = void 0;
const reselect_1 = require("reselect");
const store_keys_1 = require("../../store/store.keys");
const store_utils_1 = require("../store.utils");
exports.isConnected = (0, reselect_1.createSelector)((0, store_utils_1.selectReducer)(store_keys_1.StoreKeys.Socket), (reducerState) => reducerState.isConnected);
exports.socketSelectors = {
    isConnected: exports.isConnected
};
