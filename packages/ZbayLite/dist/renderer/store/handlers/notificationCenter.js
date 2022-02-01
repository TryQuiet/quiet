"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reducer = exports.epics = exports.setUserNotificationsSound = exports.setUserNotification = exports.unblockUserNotification = exports.setContactNotification = exports.setChannelsNotification = exports.init = exports.actions = exports.initialState = exports.NotificationsCenter = void 0;
const immer_1 = require("immer");
const redux_actions_1 = require("redux-actions");
const static_1 = require("../../../shared/static");
const electronStore_1 = __importDefault(require("../../../shared/electronStore"));
const notificationCenter_1 = __importDefault(require("../selectors/notificationCenter"));
const directMessageChannel_1 = __importDefault(require("../selectors/directMessageChannel"));
const channel_1 = __importDefault(require("../selectors/channel"));
// TODO: to remove, keeping for test purpose
exports.NotificationsCenter = {
    channels: {},
    user: {},
    contacts: {}
};
class NotificationCenter {
    constructor(values) {
        Object.assign(this, values);
        this[immer_1.immerable] = true;
    }
}
exports.initialState = Object.assign({}, new NotificationCenter({
    channels: {},
    user: {},
    contacts: {}
}));
const setChannelNotificationFilter = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_CHANNEL_NOTIFICATION_FILTER);
const setChannelNotificationSettings = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_CHANNELS_NOTIFICATION_SETTINGS);
const setUserNotificationFilter = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_USER_NOTIFICATION_FILTER);
const setUserNotificationSettings = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_USER_NOTIFICATION_SETTINGS);
const setContactNotificationFilter = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_CONTACT_NOTIFICATION_FILTER);
const setContactsNotificationSettings = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_CONTACTS_NOTIFICATION_SETTINGS);
const setUserNotificationSound = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_USER_NOTIFICATION_SOUND);
exports.actions = {
    setChannelNotificationFilter,
    setChannelNotificationSettings,
    setUserNotificationFilter,
    setUserNotificationSettings,
    setContactNotificationFilter,
    setContactsNotificationSettings,
    setUserNotificationSound
};
const init = () => (dispatch, getState) => __awaiter(void 0, void 0, void 0, function* () {
    if (!electronStore_1.default.get('notificationCenter')) {
        electronStore_1.default.set('notificationCenter', notificationCenter_1.default.notificationCenter(getState()));
    }
    const notificationData = electronStore_1.default.get('notificationCenter');
    yield dispatch(setUserNotificationSettings({
        userData: notificationData.user
    }));
    yield dispatch(setContactsNotificationSettings({
        contacts: notificationData.contacts
    }));
    yield dispatch(setChannelNotificationSettings({
        channelsData: notificationData.channels
    }));
});
exports.init = init;
const setChannelsNotification = filterType => (dispatch, getState) => __awaiter(void 0, void 0, void 0, function* () {
    const channel = channel_1.default.channel(getState());
    electronStore_1.default.set(`notificationCenter.channels.${channel.id}`, filterType);
    dispatch(setChannelNotificationFilter({
        channelId: channel.id,
        filterType: filterType
    }));
});
exports.setChannelsNotification = setChannelsNotification;
const setContactNotification = filterType => (dispatch, getState) => __awaiter(void 0, void 0, void 0, function* () {
    const address = directMessageChannel_1.default.targetRecipientAddress(getState());
    electronStore_1.default.set(`notificationCenter.contacts.${address}`, filterType);
    dispatch(setContactNotificationFilter({
        contact: address,
        filterType: filterType
    }));
});
exports.setContactNotification = setContactNotification;
const unblockUserNotification = address => (dispatch) => __awaiter(void 0, void 0, void 0, function* () {
    electronStore_1.default.set(`notificationCenter.contacts.${address}`, static_1.notificationFilterType.ALL_MESSAGES);
    dispatch(setContactNotificationFilter({
        contact: address,
        filterType: static_1.notificationFilterType.ALL_MESSAGES
    }));
});
exports.unblockUserNotification = unblockUserNotification;
const setUserNotification = filterType => (dispatch) => __awaiter(void 0, void 0, void 0, function* () {
    electronStore_1.default.set('notificationCenter.user.filterType', filterType);
    dispatch(setUserNotificationFilter({
        filterType: filterType
    }));
});
exports.setUserNotification = setUserNotification;
const setUserNotificationsSound = sound => (dispatch) => __awaiter(void 0, void 0, void 0, function* () {
    electronStore_1.default.set('notificationCenter.user.sound', sound);
    dispatch(setUserNotificationSound({
        sound: sound
    }));
});
exports.setUserNotificationsSound = setUserNotificationsSound;
exports.epics = {
    init: exports.init,
    setChannelsNotification: exports.setChannelsNotification,
    setUserNotification: exports.setUserNotification,
    setContactNotification: exports.setContactNotification,
    setUserNotificationsSound: exports.setUserNotificationsSound,
    unblockUserNotification: exports.unblockUserNotification
};
exports.reducer = (0, redux_actions_1.handleActions)({
    [setChannelNotificationFilter.toString()]: (state, { payload: { channelId, filterType } }) => (0, immer_1.produce)(state, draft => {
        draft.channels[channelId] = filterType;
    }),
    [setContactNotificationFilter.toString()]: (state, { payload: { contact, filterType } }) => (0, immer_1.produce)(state, draft => {
        draft.contacts[contact] = filterType;
    }),
    [setUserNotificationFilter.toString()]: (state, { payload: { filterType } }) => (0, immer_1.produce)(state, draft => {
        draft.user = Object.assign(Object.assign({}, draft.user), { filterType: filterType });
    }),
    [setUserNotificationSound.toString()]: (state, { payload: { sound } }) => (0, immer_1.produce)(state, draft => {
        draft.user = Object.assign(Object.assign({}, draft.user), { sound: sound });
    }),
    [setUserNotificationSettings.toString()]: (state, { payload: { userData } }) => (0, immer_1.produce)(state, draft => {
        draft.user = userData;
    }),
    [setChannelNotificationSettings.toString()]: (state, { payload: { channelsData } }) => (0, immer_1.produce)(state, draft => {
        draft.channels = channelsData;
    }),
    [setContactsNotificationSettings.toString()]: (state, { payload: { contacts } }) => (0, immer_1.produce)(state, draft => {
        draft.contacts = contacts;
    })
}, exports.initialState);
exports.default = {
    actions: exports.actions,
    epics: exports.epics,
    reducer: exports.reducer
};
