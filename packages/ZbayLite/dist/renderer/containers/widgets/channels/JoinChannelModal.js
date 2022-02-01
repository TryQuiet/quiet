"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JoinChannelModal = exports.useJoinChannelActions = void 0;
const react_1 = __importDefault(require("react"));
const react_redux_1 = require("react-redux");
const nectar_1 = require("@zbayapp/nectar");
const JoinChannelModal_1 = __importDefault(require("../../../components/widgets/channels/JoinChannelModal"));
const channel_1 = __importDefault(require("../../../store/handlers/channel"));
const modals_types_1 = require("../../../sagas/modals/modals.types");
const hooks_1 = require("../../hooks");
const useJoinChannelData = () => {
    const modalName = 'joinChannel';
    const data = {
        publicChannels: (0, react_redux_1.useSelector)(nectar_1.publicChannels.selectors.publicChannels),
        users: {},
        modalName
    };
    return data;
};
const useJoinChannelActions = () => {
    const dispatch = (0, react_redux_1.useDispatch)();
    const actions = {
        joinChannel: (channel) => {
            dispatch(channel_1.default.epics.linkChannelRedirect(channel));
        }
    };
    return actions;
};
exports.useJoinChannelActions = useJoinChannelActions;
const JoinChannelModal = () => {
    const { publicChannels, users } = useJoinChannelData();
    const { joinChannel } = (0, exports.useJoinChannelActions)();
    const modal = (0, hooks_1.useModal)(modals_types_1.ModalName.joinChannel);
    return (react_1.default.createElement(JoinChannelModal_1.default, { publicChannels: publicChannels, joinChannel: joinChannel, 
        // showNotification={showNotification}
        open: modal.open, users: users, handleClose: modal.handleClose }));
};
exports.JoinChannelModal = JoinChannelModal;
exports.default = exports.JoinChannelModal;
