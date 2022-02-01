"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_redux_1 = require("react-redux");
const nectar_1 = require("@zbayapp/nectar");
const Channel_1 = __importDefault(require("../../components/pages/Channel"));
const hooks_1 = require("../hooks");
const modals_types_1 = require("../../sagas/modals/modals.types");
const Channel = () => {
    const dispatch = (0, react_redux_1.useDispatch)();
    const user = (0, react_redux_1.useSelector)(nectar_1.identity.selectors.currentIdentity);
    const currentCommunityId = (0, react_redux_1.useSelector)(nectar_1.communities.selectors.currentCommunityId);
    const allChannels = (0, react_redux_1.useSelector)(nectar_1.publicChannels.selectors.publicChannels);
    const currentChannelAddress = (0, react_redux_1.useSelector)(nectar_1.publicChannels.selectors.currentChannel);
    const currentChannel = allChannels.find(channel => (channel === null || channel === void 0 ? void 0 : channel.address) === currentChannelAddress);
    const currentChannelMessagesCount = (0, react_redux_1.useSelector)(nectar_1.publicChannels.selectors.currentChannelMessagesCount);
    const currentChannelDisplayableMessages = (0, react_redux_1.useSelector)(nectar_1.publicChannels.selectors.currentChannelMessagesMergedBySender);
    const channelSettingsModal = (0, hooks_1.useModal)(modals_types_1.ModalName.channelSettingsModal);
    const channelInfoModal = (0, hooks_1.useModal)(modals_types_1.ModalName.channelInfo);
    const onInputChange = (0, react_1.useCallback)((_value) => {
        // TODO https://github.com/ZbayApp/ZbayLite/issues/442
    }, [dispatch]);
    const onInputEnter = (0, react_1.useCallback)((message) => {
        dispatch(nectar_1.messages.actions.sendMessage(message));
    }, [dispatch]);
    const setChannelLoadingSlice = (0, react_1.useCallback)((value) => {
        dispatch(nectar_1.publicChannels.actions.setChannelLoadingSlice({
            communityId: currentCommunityId,
            slice: value
        }));
    }, [dispatch, currentCommunityId]);
    return (react_1.default.createElement(react_1.default.Fragment, null, currentChannel && (react_1.default.createElement(Channel_1.default, { user: user, channel: currentChannel, channelSettingsModal: channelSettingsModal, channelInfoModal: channelInfoModal, messages: {
            count: currentChannelMessagesCount,
            groups: currentChannelDisplayableMessages
        }, setChannelLoadingSlice: setChannelLoadingSlice, onDelete: function () { }, onInputChange: onInputChange, onInputEnter: onInputEnter, mutedFlag: false, notificationFilter: '', openNotificationsTab: function () { } }))));
};
exports.default = Channel;
