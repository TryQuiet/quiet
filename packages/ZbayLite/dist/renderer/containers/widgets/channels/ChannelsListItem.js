"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelsListItem = void 0;
const react_1 = __importDefault(require("react"));
const react_redux_1 = require("react-redux");
const nectar_1 = require("@zbayapp/nectar");
const ChannelsListItem_1 = __importDefault(require("../../../components/widgets/channels/ChannelsListItem"));
const ChannelsListItem = ({ channel }) => {
    const dispatch = (0, react_redux_1.useDispatch)();
    const currentCommunity = (0, react_redux_1.useSelector)(nectar_1.communities.selectors.currentCommunityId);
    const currentChannel = (0, react_redux_1.useSelector)(nectar_1.publicChannels.selectors.currentChannel);
    const selected = currentChannel === channel.name;
    const setCurrentChannel = (name) => {
        dispatch(nectar_1.publicChannels.actions.setCurrentChannel({
            channel: name,
            communityId: currentCommunity
        }));
    };
    return (react_1.default.createElement(ChannelsListItem_1.default, { channel: channel, selected: selected, setCurrentChannel: setCurrentChannel }));
};
exports.ChannelsListItem = ChannelsListItem;
exports.default = exports.ChannelsListItem;
