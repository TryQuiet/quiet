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
exports.CreateChannel = void 0;
const react_1 = __importStar(require("react"));
const react_redux_1 = require("react-redux");
const CreateChannel_1 = __importDefault(require("../../../components/widgets/channels/CreateChannel/CreateChannel"));
const nectar_1 = require("@zbayapp/nectar");
const luxon_1 = require("luxon");
const hooks_1 = require("../../hooks");
const modals_types_1 = require("../../../sagas/modals/modals.types");
const CreateChannel = () => {
    const dispatch = (0, react_redux_1.useDispatch)();
    const [newChannel, setNewChannel] = (0, react_1.useState)(null);
    const user = (0, react_redux_1.useSelector)(nectar_1.identity.selectors.currentIdentity);
    const community = (0, react_redux_1.useSelector)(nectar_1.communities.selectors.currentCommunityId);
    const channels = (0, react_redux_1.useSelector)(nectar_1.publicChannels.selectors.publicChannels);
    const createChannelModal = (0, hooks_1.useModal)(modals_types_1.ModalName.createChannel);
    (0, react_1.useEffect)(() => {
        if (createChannelModal.open && channels.filter(channel => channel.name === (newChannel === null || newChannel === void 0 ? void 0 : newChannel.name)).length > 0) {
            dispatch(nectar_1.publicChannels.actions.setCurrentChannel({
                channel: newChannel.name,
                communityId: community
            }));
            setNewChannel(null);
            createChannelModal.handleClose();
        }
    }, [channels]);
    const createChannel = (name) => {
        const channel = {
            name: name,
            description: `Welcome to #${name}`,
            owner: user.zbayNickname,
            address: name,
            timestamp: luxon_1.DateTime.utc().valueOf()
        };
        setNewChannel(channel);
        dispatch(nectar_1.publicChannels.actions.createChannel({
            channel: channel,
            communityId: community
        }));
    };
    return (react_1.default.createElement(react_1.default.Fragment, null, community && (react_1.default.createElement(CreateChannel_1.default, Object.assign({}, createChannelModal, { createChannel: createChannel })))));
};
exports.CreateChannel = CreateChannel;
exports.default = exports.CreateChannel;
