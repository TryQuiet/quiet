"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reducer = exports.actions = exports.initialState = void 0;
const immer_1 = require("immer");
const redux_actions_1 = require("redux-actions");
const static_1 = require("../../../shared/static");
exports.initialState = [];
const enqueueSnackbar = (0, redux_actions_1.createAction)(static_1.actionTypes.ENQUEUE_SNACKBAR, (n) => (Object.assign({ key: new Date().getTime().toString() + Math.random().toString() }, n)));
const removeSnackbar = (0, redux_actions_1.createAction)(static_1.actionTypes.REMOVE_SNACKBAR);
exports.actions = {
    enqueueSnackbar,
    removeSnackbar
};
// TODO: [refactoring] rewrite rest of the notifications to use Notifier
exports.reducer = (0, redux_actions_1.handleActions)({
    [enqueueSnackbar.toString()]: (state, { payload: notification }) => {
        return (0, immer_1.produce)(state, draft => {
            draft.push(notification);
        });
    },
    [removeSnackbar.toString()]: (state, { payload: key }) => (0, immer_1.produce)(state, draft => draft.filter(n => n.key !== key))
}, exports.initialState);
exports.default = {
    actions: exports.actions,
    reducer: exports.reducer
};
