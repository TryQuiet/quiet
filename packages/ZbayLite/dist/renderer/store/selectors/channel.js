"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.channelParticipiants = exports.members = exports.INPUT_STATE = exports.inputLocked = exports.channelId = exports.shareableUri = exports.mergeIntoOne = exports.loader = exports.unread = exports.onlyRegistered = exports.channelDesription = exports.advertFee = exports.channelSettingsMessage = exports.displayableMessageLimit = exports.messageSizeStatus = exports.isSizeCheckingInProgress = exports.id = exports.message = exports.spentFilterValue = exports.channelInfo = void 0;
const reselect_1 = require("reselect");
const nectar_1 = require("@zbayapp/nectar");
const directMessages_1 = __importDefault(require("./directMessages"));
const waggle_1 = __importDefault(require("./waggle"));
const debug_1 = __importDefault(require("debug"));
const log = Object.assign((0, debug_1.default)('zbay:channel'), {
    error: (0, debug_1.default)('zbay:channel:err')
});
const channel = (s) => s.channel;
const contacts = (s) => s.contacts;
exports.channelInfo = (0, reselect_1.createSelector)(channel, (ch) => {
    const channel = Object.assign({}, ch);
    delete channel.message;
    return channel;
}); // TODO refactor
const isPublicChannel = (0, reselect_1.createSelector)(nectar_1.publicChannels.selectors.publicChannels, channel, (pubChannels, channel) => {
    if (pubChannels && channel) {
        const publicChannelAddresses = Object.values(pubChannels).map(el => el.address);
        const { address } = channel;
        return publicChannelAddresses.includes(address);
    }
    else {
        return false;
    }
});
const isDirectMessage = (0, reselect_1.createSelector)(directMessages_1.default.users, channel, (users, channel) => {
    if (users && channel) {
        const { id } = channel;
        const usersIds = Array.from(Object.keys(users));
        log(`checking if it is DM ${id}, ${usersIds}`);
        return usersIds.includes(id);
    }
    else {
        return false;
    }
});
exports.spentFilterValue = (0, reselect_1.createSelector)(channel, c => c.spentFilterValue ? exports.spentFilterValue : -1);
exports.message = (0, reselect_1.createSelector)(channel, c => c.message[c.id] || '');
exports.id = (0, reselect_1.createSelector)(channel, c => c.id);
const data = (0, reselect_1.createSelector)(contacts, exports.id, (channels, id) => channels[id]);
exports.isSizeCheckingInProgress = (0, reselect_1.createSelector)(channel, c => c.isSizeCheckingInProgress);
exports.messageSizeStatus = (0, reselect_1.createSelector)(channel, c => c.messageSizeStatus);
exports.displayableMessageLimit = (0, reselect_1.createSelector)(channel, c => c.displayableMessageLimit);
// export const isOwner = createSelector(
//   id,
//   contacts,
//   null,
//   (id, con, myKey) => {
//     const contact = con[id]
//     if (!contact) {
//       return false
//     }
//     const settingsMsg = Array.from(Object.values(contact.messages)).filter(
//       msg => msg.type === messageType.CHANNEL_SETTINGS
//     )[0]
//     if (settingsMsg && settingsMsg.message.owner === myKey) {
//       return true
//     }
//     return false
//   }
// )
exports.channelSettingsMessage = (0, reselect_1.createSelector)(data, data => {
    if (!data) {
        return null;
    }
    const settingsMsg = Array.from(Object.values(data.messages)).filter(_msg => null);
    if (!settingsMsg.length) {
        return null;
    }
    return settingsMsg.reduce((prev, curr) => (prev.createdAt > curr.createdAt ? prev : curr));
});
exports.advertFee = (0, reselect_1.createSelector)(exports.channelSettingsMessage, settingsMsg => {
    if (settingsMsg === null) {
        return 0;
    }
    return settingsMsg.message.minFee || settingsMsg.message.updateMinFee;
});
exports.channelDesription = (0, reselect_1.createSelector)(exports.channelSettingsMessage, settingsMsg => {
    if (settingsMsg === null) {
        return 0;
    }
    return settingsMsg.message.updateChannelDescription || '';
});
exports.onlyRegistered = (0, reselect_1.createSelector)(exports.channelSettingsMessage, settingsMsg => {
    if (settingsMsg === null) {
        return 0;
    }
    return settingsMsg.message.updateOnlyRegistered || '0';
});
exports.unread = (0, reselect_1.createSelector)(data, data => (data ? data.unread : 0));
exports.loader = (0, reselect_1.createSelector)(channel, meta => meta.loader);
const concatMessages = (mainMsg, messagesToConcat) => {
    if (messagesToConcat.length === 1) {
        return mainMsg;
    }
    else {
        messagesToConcat.sort((a, b) => {
            return a.createdAt - b.createdAt;
        });
        const messagesArray = messagesToConcat.map(msg => msg.message);
        const lastMessageStatus = messagesToConcat[messagesToConcat.length - 1].status;
        const concatedMessages = messagesArray.join('\n');
        const mergedMessage = Object.assign(Object.assign({}, mainMsg), { message: concatedMessages, status: lastMessageStatus });
        return mergedMessage;
    }
};
const mergeIntoOne = (messages) => {
    if (messages.length === 0)
        return;
    const result = [];
    const timeOfStackMessages = 300; // in seconds
    let lastPubKey = null;
    let lastCteatedAt = null;
    for (const msg of messages) {
        if (lastPubKey && lastPubKey !== msg.pubKey) {
            result.push([]);
            result[result.length - 1].push(msg);
        }
        else if (lastCteatedAt && ((lastCteatedAt - msg.createdAt) < timeOfStackMessages)) {
            result[result.length - 1].push(msg);
        }
        else {
            result.push([]);
            result[result.length - 1].push(msg);
        }
        lastPubKey = msg.pubKey;
        lastCteatedAt = msg.createdAt;
    }
    const concatedMessages = result.map(array => {
        return concatMessages(array[0], array);
    });
    return concatedMessages;
};
exports.mergeIntoOne = mergeIntoOne;
exports.shareableUri = (0, reselect_1.createSelector)(channel, c => c.shareableUri);
exports.channelId = (0, reselect_1.createSelector)(channel, ch => ch.id);
exports.inputLocked = (0, reselect_1.createSelector)(exports.channelId, directMessages_1.default.users, waggle_1.default.isConnected, isPublicChannel, (channelId, waggleContacts, waggle, publicChannel) => {
    var _a, _b, _c, _d;
    const contactsData = Object.values(waggleContacts);
    const currentContactArray = contactsData.filter(item => {
        return item.publicKey === channelId || item.nickname === channelId;
    });
    if (!waggle) {
        return INPUT_STATE.NOT_CONNECTED;
    }
    if (publicChannel || !((_b = (_a = currentContactArray[0]) === null || _a === void 0 ? void 0 : _a.nickname) === null || _b === void 0 ? void 0 : _b.startsWith('anon'))) {
        return INPUT_STATE.AVAILABLE;
    }
    if (!currentContactArray[0] || ((_d = (_c = currentContactArray[0]) === null || _c === void 0 ? void 0 : _c.nickname) === null || _d === void 0 ? void 0 : _d.startsWith('anon'))) {
        return INPUT_STATE.USER_NOT_REGISTERED;
    }
    return INPUT_STATE.NOT_CONNECTED;
});
var INPUT_STATE;
(function (INPUT_STATE) {
    INPUT_STATE[INPUT_STATE["NOT_CONNECTED"] = 0] = "NOT_CONNECTED";
    INPUT_STATE[INPUT_STATE["USER_NOT_REGISTERED"] = 1] = "USER_NOT_REGISTERED";
    INPUT_STATE[INPUT_STATE["AVAILABLE"] = 2] = "AVAILABLE";
})(INPUT_STATE = exports.INPUT_STATE || (exports.INPUT_STATE = {}));
exports.members = (0, reselect_1.createSelector)(contacts, exports.id, (c, channelId) => {
    const contact = c[channelId];
    if (!contact) {
        return new Set();
    }
});
exports.channelParticipiants = (0, reselect_1.createSelector)(contacts, exports.id, (c, i) => {
    const contact = c[i];
    if (!contact) {
        return new Set();
    }
    return exports.members;
});
const address = (0, reselect_1.createSelector)(channel, (c) => c.address);
exports.default = {
    data,
    inputLocked: exports.inputLocked,
    loader: exports.loader,
    channel,
    spentFilterValue: exports.spentFilterValue,
    message: exports.message,
    shareableUri: exports.shareableUri,
    channelId: exports.channelId,
    channelInfo: exports.channelInfo,
    advertFee: exports.advertFee,
    onlyRegistered: exports.onlyRegistered,
    members: exports.members,
    channelParticipiants: exports.channelParticipiants,
    unread: exports.unread,
    messageSizeStatus: exports.messageSizeStatus,
    isSizeCheckingInProgress: exports.isSizeCheckingInProgress,
    id: exports.id,
    // isOwner,
    channelDesription: exports.channelDesription,
    displayableMessageLimit: exports.displayableMessageLimit,
    isPublicChannel,
    isDirectMessage,
    address
};
