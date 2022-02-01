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
exports.reducer = exports.epics = exports.actions = exports.initialState = exports.Mentions = exports.ChannelMentions = void 0;
const immer_1 = require("immer");
const redux_actions_1 = require("redux-actions");
const channel_1 = __importDefault(require("../selectors/channel"));
const static_1 = require("../../../shared/static");
// TODO: remove after changing in tests
exports.ChannelMentions = {
    nickname: '',
    timeStamp: 0
};
class Mentions {
    constructor(values) {
        Object.assign(this, values);
        this[immer_1.immerable] = true;
    }
}
exports.Mentions = Mentions;
exports.initialState = {};
const addMentionMiss = (0, redux_actions_1.createAction)(static_1.actionTypes.ADD_MENTION_MISS);
const clearMentionMiss = (0, redux_actions_1.createAction)(static_1.actionTypes.CLEAR_MENTION_MISS);
const removeMentionMiss = (0, redux_actions_1.createAction)(static_1.actionTypes.REMOVE_MENTION_MISS);
exports.actions = {
    addMentionMiss,
    clearMentionMiss,
    removeMentionMiss
};
const checkMentions = () => (dispatch, getState) => __awaiter(void 0, void 0, void 0, function* () {
    const channelId = channel_1.default.channelId(getState());
    // const message = channelSelectors.message(getState())
    // const users = usersSelectors.users(getState())
    // const currentMentions = mentionsSelectors.mentionForChannel(channelId)(getState())
    // const splitMessage = message
    //   .split(String.fromCharCode(160))
    //   .filter(part => part.startsWith('@'))
    //   .filter(part =>
    //     Array.from(Object.values(users)).find(user => user.nickname === part.substring(1))
    //   )
    const foundMentions = [];
    // for (const mention of splitMessage) {
    //   if (!usersOnChannel.find(user => user.nickname === mention.substring(1).trim())) {
    //     if (!currentMentions.find(c => c.nickname === mention.substring(1).trim())) {
    //       foundMentions.push(
    //         new Mentions({
    //           nickname: mention.substring(1).trim(),
    //           timeStamp: DateTime.utc().toSeconds()
    //         })
    //       )
    //     }
    //   }
    // }
    if (foundMentions.length > 0) {
        dispatch(addMentionMiss({ mentions: foundMentions, channelId }));
    }
});
const removeMention = nickname => (dispatch, getState) => __awaiter(void 0, void 0, void 0, function* () {
    const channelId = channel_1.default.channelId(getState());
    dispatch(removeMentionMiss({ channelId, nickname }));
});
exports.epics = {
    checkMentions,
    removeMention
};
exports.reducer = (0, redux_actions_1.handleActions)({
    [clearMentionMiss.toString()]: state => (0, immer_1.produce)(state, () => {
        return Object.assign({}, exports.initialState);
    }),
    [removeMentionMiss.toString()]: (state, { payload: { channelId, nickname } }) => (0, immer_1.produce)(state, draft => {
        draft[channelId] = draft[channelId].filter(mention => mention.nickname !== nickname);
    }),
    [addMentionMiss.toString()]: (state, { payload: { mentions, channelId } }) => (0, immer_1.produce)(state, draft => {
        if (!draft[channelId]) {
            draft[channelId] = [...mentions];
        }
        else {
            draft[channelId] = [...draft[channelId], ...mentions];
        }
    })
}, exports.initialState);
exports.default = {
    actions: exports.actions,
    reducer: exports.reducer,
    epics: exports.epics
};
