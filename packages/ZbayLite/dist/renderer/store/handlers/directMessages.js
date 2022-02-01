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
exports.reducer = exports.epics = exports.getPrivateConversations = exports.actions = exports.initialState = exports.DirectMessages = void 0;
const immer_1 = require("immer");
const crypto_1 = __importDefault(require("crypto"));
const redux_actions_1 = require("redux-actions");
const static_1 = require("../../../shared/static");
// import { directMessagesActions } from '../../sagas/directMessages/directMessages.reducer'
const cryptography_1 = require("../../cryptography/cryptography");
class DirectMessages {
    constructor(values) {
        Object.assign(this, values);
        this[immer_1.immerable] = true;
    }
}
exports.DirectMessages = DirectMessages;
exports.initialState = {
    users: {},
    conversations: {},
    conversationsList: {},
    privateKey: '',
    publicKey: ''
};
const fetchUsers = (0, redux_actions_1.createAction)(static_1.actionTypes.FETCH_USERS);
const setPublicKey = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_PUBLIC_KEY);
const setPrivateKey = (0, redux_actions_1.createAction)(static_1.actionTypes.SET_PRIVATE_KEY);
const addConversation = (0, redux_actions_1.createAction)(static_1.actionTypes.ADD_CONVERSATION);
const fetchConversations = (0, redux_actions_1.createAction)(static_1.actionTypes.FETCH_CONVERSATIONS);
exports.actions = {
    fetchUsers,
    setPublicKey,
    setPrivateKey,
    addConversation,
    fetchConversations
};
const generateDiffieHellman = () => (dispatch) => __awaiter(void 0, void 0, void 0, function* () {
    const dh = crypto_1.default.createDiffieHellman(cryptography_1.constants.prime, 'hex', cryptography_1.constants.generator, 'hex');
    dh.generateKeys();
    const privateKey = dh.getPrivateKey('hex');
    const publicKey = dh.getPublicKey('hex');
    yield dispatch(exports.actions.setPrivateKey(privateKey));
    yield dispatch(exports.actions.setPublicKey(publicKey));
});
const getPrivateConversations = () => _dispatch => {
    // dispatch(directMessagesActions.getPrivateConversations())
};
exports.getPrivateConversations = getPrivateConversations;
const subscribeToAllConversations = () => (_dispatch) => __awaiter(void 0, void 0, void 0, function* () {
    // await dispatch(directMessagesActions.subscribeToAllConversations())
});
const getAvailableUsers = () => (_dispatch) => __awaiter(void 0, void 0, void 0, function* () {
    // await dispatch(directMessagesActions.getAvailableUsers())
});
exports.epics = {
    generateDiffieHellman,
    getAvailableUsers,
    getPrivateConversations: exports.getPrivateConversations,
    subscribeToAllConversations
};
exports.reducer = (0, redux_actions_1.handleActions)({
    [fetchUsers.toString()]: (state, { payload: { usersList } }) => (0, immer_1.produce)(state, draft => {
        draft.users = Object.assign(Object.assign({}, draft.users), usersList);
    }),
    [fetchConversations.toString()]: (state, { payload: { conversationsList } }) => (0, immer_1.produce)(state, draft => {
        draft.conversationsList = Object.assign(Object.assign({}, draft.conversationsList), conversationsList);
    }),
    [setPublicKey.toString()]: (state, { payload: publicKey }) => (0, immer_1.produce)(state, draft => {
        draft.publicKey = publicKey;
    }),
    [setPrivateKey.toString()]: (state, { payload: privateKey }) => (0, immer_1.produce)(state, draft => {
        draft.privateKey = privateKey;
    }),
    [addConversation.toString()]: (state, { payload: conversation }) => (0, immer_1.produce)(state, draft => {
        draft.conversations = Object.assign(Object.assign({}, draft.conversations), { [conversation.conversationId]: conversation });
    })
}, exports.initialState);
exports.default = {
    actions: exports.actions,
    epics: exports.epics,
    reducer: exports.reducer
};
