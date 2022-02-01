"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reducer = exports.actions = exports.initialState = void 0;
const immer_1 = require("immer");
const redux_actions_1 = require("redux-actions");
const static_1 = require("../../../shared/static");
class DirectMessageChannel {
    constructor(values) {
        Object.assign(this, values);
        this[immer_1.immerable] = true;
    }
}
exports.initialState = Object.assign({}, new DirectMessageChannel());
const setDirectMessageRecipientUsername = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_DIRECT_MESSAGE_RECIPIENT_USERNAME);
const setDirectMessageRecipientAddress = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_DIRECT_MESSAGE_RECIPIENT_ADDRESS);
const resetDirectMessageChannel = (0, redux_actions_1.createAction)(static_1.actionTypes.RESET_DIRECT_MESSAGE_CHANNEL);
exports.actions = {
    setDirectMessageRecipientAddress,
    setDirectMessageRecipientUsername,
    resetDirectMessageChannel
};
exports.reducer = (0, redux_actions_1.handleActions)({
    [setDirectMessageRecipientAddress.toString()]: (state, { payload: id }) => (0, immer_1.produce)(state, draft => {
        draft.targetRecipientAddress = id;
    }),
    [setDirectMessageRecipientUsername.toString()]: (state, { payload: username }) => (0, immer_1.produce)(state, draft => {
        draft.targetRecipientUsername = username;
    }),
    [resetDirectMessageChannel.toString()]: state => (0, immer_1.produce)(state, draft => {
        draft.targetRecipientAddress = null;
        draft.targetRecipientUsername = null;
    })
}, exports.initialState);
exports.default = {
    reducer: exports.reducer,
    actions: exports.actions
};
