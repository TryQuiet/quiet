"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modalsSelectors = exports.props = exports.open = void 0;
const reselect_1 = require("reselect");
const store_keys_1 = require("../../store/store.keys");
const ModalsSlice = (state) => state[store_keys_1.StoreKeys.Modals];
const open = (modal) => (0, reselect_1.createSelector)(ModalsSlice, reducerState => {
    var _a;
    return (_a = reducerState[modal]) === null || _a === void 0 ? void 0 : _a.open;
});
exports.open = open;
const props = (modal) => (0, reselect_1.createSelector)(ModalsSlice, reducerState => {
    var _a;
    return ((_a = reducerState[modal]) === null || _a === void 0 ? void 0 : _a.args) || {};
});
exports.props = props;
exports.modalsSelectors = {
    open: exports.open,
    props: exports.props
};
