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
exports.reducer = exports.epics = exports.deleteChannel = exports.createVaultContact = exports.updateLastSeen = exports.linkUserRedirect = exports.updatePendingMessage = exports.loadContact = exports.actions = exports.Contact = void 0;
const immer_1 = require("immer");
const luxon_1 = require("luxon");
const redux_actions_1 = require("redux-actions");
const electron_1 = require("electron");
const history_1 = __importDefault(require("../../../shared/history"));
const static_1 = require("../../../shared/static");
const contacts_1 = __importDefault(require("../selectors/contacts"));
class Contact {
    constructor(values) {
        this.key = '';
        this.username = '';
        this.address = '';
        this.newMessages = [];
        this.vaultMessages = [];
        this.messages = [];
        this.typingIndicator = false;
        Object.assign(this, values);
        this[immer_1.immerable] = true;
    }
}
exports.Contact = Contact;
const initialState = {};
const setMessages = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_DIRECT_MESSAGES);
const setChannelMessages = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_CHANNEL_MESSAGES);
const addContact = (0, redux_actions_1.createAction)(static_1.actionTypes.ADD_CONTACT);
const addDirectContact = (0, redux_actions_1.createAction)(static_1.actionTypes.ADD_DIRECT_CONTACT);
const addMessage = (0, redux_actions_1.createAction)(static_1.actionTypes.ADD_MESSAGE);
const setAllMessages = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_ALL_MESSAGES);
const updateMessage = (0, redux_actions_1.createAction)(static_1.actionTypes.UPDATE_MESSAGE);
const setMessageBlockTime = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_MESSAGE_BLOCKTIME);
const cleanNewMessages = (0, redux_actions_1.createAction)(static_1.actionTypes.CLEAN_NEW_DIRECT_MESSAGESS);
const appendNewMessages = (0, redux_actions_1.createAction)(static_1.actionTypes.APPEND_NEW_DIRECT_MESSAGES);
const setLastSeen = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_CONTACTS_LAST_SEEN);
const setTypingIndicator = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_TYPING_INDICATOR);
const removeContact = (0, redux_actions_1.createAction)(static_1.actionTypes.REMOVE_CONTACT);
const setUsernames = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_CONTACTS_USERNAMES);
const setVaultMessages = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_VAULT_DIRECT_MESSAGES);
const setContactConnected = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_CONTACT_CONNECTED);
exports.actions = {
    setMessages,
    setChannelMessages,
    setAllMessages,
    updateMessage,
    addMessage,
    addContact,
    addDirectContact,
    setVaultMessages,
    cleanNewMessages,
    appendNewMessages,
    setLastSeen,
    setUsernames,
    removeContact,
    setMessageBlockTime,
    setContactConnected,
    setTypingIndicator
};
const loadContact = address => (dispatch, getState) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('loadContact');
    const contact = contacts_1.default.contact(address)(getState());
    dispatch((0, exports.updateLastSeen)({ contact }));
});
exports.loadContact = loadContact;
const updatePendingMessage = ({ key, id, txid }) => (dispatch) => __awaiter(void 0, void 0, void 0, function* () {
    dispatch(updateMessage({ key, id, txid }));
});
exports.updatePendingMessage = updatePendingMessage;
const linkUserRedirect = contact => (dispatch, getState) => __awaiter(void 0, void 0, void 0, function* () {
    const contacts = contacts_1.default.contacts(getState());
    if (contacts[contact.nickname]) {
        history_1.default.push(`/main/direct-messages/${contact.nickname}`);
    }
    yield dispatch(setUsernames({
        sender: {
            replyTo: contact.address,
            username: contact.nickname
        }
    }));
    history_1.default.push(`/main/direct-messages/${contact.nickname}`);
});
exports.linkUserRedirect = linkUserRedirect;
const updateLastSeen = ({ contact }) => (dispatch, getState) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('updateLastSeen');
    const lastSeen = luxon_1.DateTime.utc();
    const unread = contacts_1.default.newMessages(contact.address)(getState()).length;
    electron_1.remote.app.badgeCount = electron_1.remote.app.badgeCount - unread;
    dispatch(cleanNewMessages({ contactAddress: contact.username }));
    dispatch(cleanNewMessages({ contactAddress: contact.address }));
    dispatch(setLastSeen({
        lastSeen,
        contact
    }));
});
exports.updateLastSeen = updateLastSeen;
const createVaultContact = ({ contact, history, redirect = true }) => (dispatch, getState) => __awaiter(void 0, void 0, void 0, function* () {
    const contacts = contacts_1.default.contacts(getState());
    if (!contacts[contact.nickname]) {
        yield dispatch(addDirectContact({
            key: contact.publicKey,
            username: contact.nickname,
            contactAddress: contact.address
        }));
    }
    if (redirect) {
        history.push(`/main/direct-messages/${contact.nickname}`);
    }
});
exports.createVaultContact = createVaultContact;
const deleteChannel = ({ address, history }) => (dispatch) => __awaiter(void 0, void 0, void 0, function* () {
    history.push('/main/channel/general');
    dispatch(removeContact(address));
});
exports.deleteChannel = deleteChannel;
exports.epics = {
    updateLastSeen: exports.updateLastSeen,
    loadContact: exports.loadContact,
    createVaultContact: exports.createVaultContact,
    deleteChannel: exports.deleteChannel,
    linkUserRedirect: exports.linkUserRedirect
};
exports.reducer = (0, redux_actions_1.handleActions)({
    [setMessages.toString()]: (state, { payload: { key, username, contactAddress, messages } }) => (0, immer_1.produce)(state, draft => {
        if (!draft[username]) {
            draft[username] = {
                lastSeen: null,
                messages: [],
                newMessages: [],
                vaultMessages: [],
                offerId: null,
                key,
                address: contactAddress,
                username,
                typingIndicator: false
            };
        }
        draft[username].messages = Object.assign(Object.assign({}, draft[username].messages), messages);
    }),
    [setChannelMessages.toString()]: (state, { payload: { key, username, contactAddress, messages } }) => (0, immer_1.produce)(state, draft => {
        if (!draft[key]) {
            draft[key] = {
                lastSeen: null,
                messages: [],
                newMessages: [],
                vaultMessages: [],
                offerId: null,
                key,
                address: contactAddress,
                username,
                typingIndicator: false
            };
        }
        draft[key].messages = Object.assign(Object.assign({}, draft[key].messages), messages);
    }),
    [setAllMessages.toString()]: (state, { payload: { key, username, contactAddress, messages } }) => (0, immer_1.produce)(state, draft => {
        if (!draft[key]) {
            draft[key] = {
                lastSeen: null,
                messages: [],
                newMessages: [],
                vaultMessages: [],
                offerId: null,
                key,
                address: contactAddress,
                username,
                typingIndicator: false
            };
        }
        draft[key].messages = Object.assign({}, messages);
    }),
    [addContact.toString()]: (state, { payload: { key, username, contactAddress, offerId = null } }) => (0, immer_1.produce)(state, draft => {
        if (key === 'zbay')
            return;
        draft[key] = {
            lastSeen: null,
            messages: [],
            newMessages: [],
            vaultMessages: [],
            offerId: offerId,
            key,
            address: contactAddress,
            username,
            typingIndicator: false
        };
    }),
    [addDirectContact.toString()]: (state, { payload: { key, username, contactAddress, offerId = null } }) => (0, immer_1.produce)(state, draft => {
        if (username === 'zbay')
            return;
        draft[username] = {
            lastSeen: null,
            messages: [],
            newMessages: [],
            vaultMessages: [],
            offerId: offerId,
            key,
            address: contactAddress,
            username,
            typingIndicator: false
        };
    }),
    [addMessage.toString()]: (state, { payload: { key, message } }) => (0, immer_1.produce)(state, draft => {
        const messageId = Object.keys(message)[0];
        if (!(messageId in draft[key].messages)) {
            draft[key].messages = Object.assign(Object.assign({}, draft[key].messages), message);
        }
    }),
    [updateMessage.toString()]: (state, { payload: { key, id, txid } }) => (0, immer_1.produce)(state, draft => {
        const tempMsg = draft[key].messages[id];
        delete draft[key].messages[id];
        draft[key].messages[txid] = tempMsg;
    }),
    [cleanNewMessages.toString()]: (state, { payload: { contactAddress } }) => (0, immer_1.produce)(state, draft => {
        if (!draft[contactAddress])
            return;
        draft[contactAddress].newMessages = [];
    }),
    [appendNewMessages.toString()]: (state, { payload: { contactAddress, messagesIds } }) => (0, immer_1.produce)(state, draft => {
        draft[contactAddress].newMessages = draft[contactAddress].newMessages.concat(messagesIds);
        electron_1.remote.app.setBadgeCount(electron_1.remote.app.getBadgeCount() + messagesIds.length);
    }),
    [setLastSeen.toString()]: (state, { payload: { lastSeen, contact } }) => (0, immer_1.produce)(state, draft => {
        draft[contact.key].lastSeen = lastSeen;
    }),
    [removeContact.toString()]: (state, { payload: { address } }) => (0, immer_1.produce)(state, draft => {
        delete draft[address];
    }),
    [setUsernames.toString()]: (state, { payload: { sender } }) => (0, immer_1.produce)(state, draft => {
        draft[sender.replyTo].username = sender.username;
        draft[sender.replyTo].address = sender.replyTo;
    })
}, initialState);
exports.default = {
    epics: exports.epics,
    actions: exports.actions,
    reducer: exports.reducer
};
