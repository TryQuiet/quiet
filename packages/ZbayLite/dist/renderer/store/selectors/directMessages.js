"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationsList = exports.conversations = exports.privateKey = exports.publicKey = exports.userByPublicKey = exports.user = exports.users = void 0;
const reselect_1 = require("reselect");
const directMessages = (s) => s.directMessages;
exports.users = (0, reselect_1.createSelector)(directMessages, (d) => {
    return d.users;
});
const user = (publicKey) => (0, reselect_1.createSelector)(exports.users, (d) => {
    return d[publicKey];
});
exports.user = user;
const userByPublicKey = (publicKey) => (0, reselect_1.createSelector)(exports.users, (d) => {
    return Array.from(Object.values(d)).find(u => u.publicKey === publicKey);
});
exports.userByPublicKey = userByPublicKey;
exports.publicKey = (0, reselect_1.createSelector)(directMessages, d => d.publicKey);
exports.privateKey = (0, reselect_1.createSelector)(directMessages, d => d.privateKey);
exports.conversations = (0, reselect_1.createSelector)(directMessages, d => d.conversations);
exports.conversationsList = (0, reselect_1.createSelector)(directMessages, d => d.conversationsList);
exports.default = {
    users: exports.users,
    user: exports.user,
    publicKey: exports.publicKey,
    privateKey: exports.privateKey,
    conversations: exports.conversations,
    conversationsList: exports.conversationsList,
    userByPublicKey: exports.userByPublicKey
};
