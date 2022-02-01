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
exports.epics = exports.reducer = exports.actions = exports.initialState = exports.Channel = exports.ChannelState = void 0;
const immer_1 = require("immer");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const redux_actions_1 = require("redux-actions");
const electron_1 = require("electron");
const luxon_1 = require("luxon");
const history_1 = __importDefault(require("../../../shared/history"));
const contacts_1 = __importDefault(require("../selectors/contacts"));
const static_1 = require("../../../shared/static");
const contacts_2 = __importDefault(require("./contacts"));
const electronStore_1 = __importDefault(require("../../../shared/electronStore"));
// import { publicChannelsActions } from '../../sagas/publicChannels/publicChannels.reducer'xs
const nectar_1 = require("@zbayapp/nectar");
// TODO: to remove, but must be replaced in all the tests
exports.ChannelState = {
    spentFilterValue: new bignumber_js_1.default(0),
    id: null,
    message: {},
    shareableUri: '',
    address: '',
    loader: {
        loading: false,
        message: ''
    },
    members: null,
    showInfoMsg: true,
    isSizeCheckingInProgress: false,
    messageSizeStatus: null,
    displayableMessageLimit: 50
};
// TODO: find type of message and members
class Channel {
    constructor(values) {
        this.displayableMessageLimit = 50;
        Object.assign(this, values);
        this[immer_1.immerable] = true;
    }
}
exports.Channel = Channel;
exports.initialState = new Channel({
    spentFilterValue: new bignumber_js_1.default(0),
    message: {},
    shareableUri: '',
    address: '',
    loader: { loading: false, message: '' },
    members: {},
    showInfoMsg: true,
    isSizeCheckingInProgress: false,
    displayableMessageLimit: 50
});
const setLoading = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_CHANNEL_LOADING);
const setSpentFilterValue = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_SPENT_FILTER_VALUE, (_, value) => value);
const setMessage = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_CHANNEL_MESSAGE);
const setChannelId = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_CHANNEL_ID);
const isSizeCheckingInProgress = (0, redux_actions_1.createAction)(static_1.actionTypes.IS_SIZE_CHECKING_IN_PROGRESS);
const messageSizeStatus = (0, redux_actions_1.createAction)(static_1.actionTypes.MESSAGE_SIZE_STATUS);
const setShareableUri = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_CHANNEL_SHAREABLE_URI);
const setDisplayableLimit = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_DISPLAYABLE_LIMIT);
const setAddress = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_CHANNEL_ADDRESS);
const resetChannel = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_CHANNEL);
exports.actions = {
    setLoading,
    setSpentFilterValue,
    setMessage,
    setShareableUri,
    setChannelId,
    resetChannel,
    isSizeCheckingInProgress,
    setAddress,
    messageSizeStatus,
    setDisplayableLimit
};
const loadChannel = key => (dispatch, getState) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('loadChannel', key);
    try {
        dispatch(nectar_1.publicChannels.actions.setCurrentChannel(key));
        dispatch(setChannelId(key));
        dispatch(setDisplayableLimit(30));
        const contact = contacts_1.default.contact(key)(getState());
        const unread = contact.newMessages.length;
        electron_1.remote.app.setBadgeCount(electron_1.remote.app.getBadgeCount() - unread);
        electronStore_1.default.set(`lastSeen.${key}`, `${Math.floor(luxon_1.DateTime.utc().toSeconds())}`);
        dispatch(setAddress(contact.address));
        dispatch(contacts_2.default.actions.cleanNewMessages({ contactAddress: contact.key }));
        dispatch(contacts_2.default.actions.cleanNewMessages({ contactAddress: key }));
    }
    catch (err) {
        console.log(err);
    }
});
const linkChannelRedirect = targetChannel => (dispatch, _getState) => __awaiter(void 0, void 0, void 0, function* () {
    // const contact = contactsSelectors.contact(targetChannel.address)(getState())
    // if (targetChannel.name === 'zbay') {
    //   history.push('/main/channel/zs10zkaj29rcev9qd5xeuzck4ly5q64kzf6m6h9nfajwcvm8m2vnjmvtqgr0mzfjywswwkwke68t00')
    //   return
    // }
    // if (contact.address) {
    //   history.push(`/main/channel/${targetChannel.address}`)
    //   return
    // }
    dispatch(nectar_1.publicChannels.actions.setCurrentChannel(targetChannel.address));
    // await dispatch(
    //   contactsHandlers.actions.addContact({
    //     key: targetChannel.address,
    //     contactAddress: targetChannel.address,
    //     username: targetChannel.name
    //   })
    // )
    history_1.default.push(`/main/channel/${targetChannel.address}`);
});
const clearNewMessages = () => (_dispatch, _getState) => __awaiter(void 0, void 0, void 0, function* () {
});
// TODO: we should have a global loader map
exports.reducer = (0, redux_actions_1.handleActions)({
    [setLoading.toString()]: (state, { payload: loading }) => (0, immer_1.produce)(state, draft => {
        draft.loader.loading = loading;
    }),
    [setSpentFilterValue.toString()]: (state, { payload: value }) => (0, immer_1.produce)(state, draft => {
        draft.spentFilterValue = new bignumber_js_1.default(value);
    }),
    [setMessage.toString()]: (state, { payload: { value, id } }) => (0, immer_1.produce)(state, draft => {
        draft.message[id] = value;
    }),
    [setChannelId.toString()]: (state, { payload: id }) => (0, immer_1.produce)(state, draft => {
        draft.id = id;
    }),
    [isSizeCheckingInProgress.toString()]: (state, { payload }) => (0, immer_1.produce)(state, draft => {
        draft.isSizeCheckingInProgress = payload;
    }),
    [messageSizeStatus.toString()]: (state, { payload }) => (0, immer_1.produce)(state, draft => {
        draft.messageSizeStatus = payload;
    }),
    [setShareableUri.toString()]: (state, { payload: uri }) => (0, immer_1.produce)(state, draft => {
        draft.shareableUri = uri;
    }),
    [setDisplayableLimit.toString()]: (state, { payload: limit }) => (0, immer_1.produce)(state, draft => {
        draft.displayableMessageLimit = limit;
    }),
    [setAddress.toString()]: (state, { payload: address }) => (0, immer_1.produce)(state, draft => {
        draft.address = address;
    }),
    [resetChannel.toString()]: () => exports.initialState
}, exports.initialState);
exports.epics = {
    loadChannel,
    clearNewMessages,
    linkChannelRedirect
};
exports.default = {
    reducer: exports.reducer,
    epics: exports.epics,
    actions: exports.actions
};
