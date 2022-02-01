"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mentionForChannel = void 0;
const reselect_1 = require("reselect");
const mentions = (s) => s.mentions;
const mentionForChannel = channelId => (0, reselect_1.createSelector)(mentions, state => state[channelId] || []);
exports.mentionForChannel = mentionForChannel;
exports.default = {
    mentions,
    mentionForChannel: exports.mentionForChannel
};
