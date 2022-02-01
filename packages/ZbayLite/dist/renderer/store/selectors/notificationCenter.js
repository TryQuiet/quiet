"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reselect_1 = require("reselect");
const static_1 = require("../../../shared/static");
const notificationCenter = (s) => s.notificationCenter;
const channels = (0, reselect_1.createSelector)(notificationCenter, a => a.channels);
const user = (0, reselect_1.createSelector)(notificationCenter, a => a.user);
const contacts = (0, reselect_1.createSelector)(notificationCenter, a => a.contacts);
const userFilterType = (0, reselect_1.createSelector)(user, a => a.filterType || static_1.notificationFilterType.ALL_MESSAGES);
const userSound = (0, reselect_1.createSelector)(user, a => a.sound || static_1.soundType.NONE);
const channelFilterById = channelId => (0, reselect_1.createSelector)(channels, channels => channels[channelId] || static_1.notificationFilterType.ALL_MESSAGES);
const blockedUsers = (0, reselect_1.createSelector)(contacts, contacts => Array.from(Object.values(contacts)).filter(type => type === static_1.notificationFilterType.MUTE));
const contactFilterByAddress = address => (0, reselect_1.createSelector)(contacts, contacts => contacts[address] || static_1.notificationFilterType.ALL_MESSAGES);
exports.default = {
    channels,
    user,
    contacts,
    channelFilterById,
    userFilterType,
    notificationCenter,
    contactFilterByAddress,
    userSound,
    blockedUsers
};
