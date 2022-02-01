"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModeratorActionsPopper = exports.mapDispatchToProps = void 0;
const react_1 = __importDefault(require("react"));
const redux_1 = require("redux");
const react_redux_1 = require("react-redux");
const ModeratorActionsPopper_1 = __importDefault(require("../../../components/widgets/channels/ModeratorActionsPopper"));
const mapDispatchToProps = dispatch => {
    return (0, redux_1.bindActionCreators)({
        banUser: () => { },
        // moderationHandlers.epics.handleModerationAction({
        //   moderationType: moderationActionsType.BLOCK_USER,
        //   moderationTarget: publicKey
        // }
        removeMessage: () => { }
        // moderationHandlers.epics.handleModerationAction({
        //   moderationType: moderationActionsType.REMOVE_MESSAGE,
        //   moderationTarget: txid
        // })
    }, dispatch);
};
exports.mapDispatchToProps = mapDispatchToProps;
const ModeratorActionsPopper = ({ name, address, open, anchorEl, banUser }) => {
    return (react_1.default.createElement(ModeratorActionsPopper_1.default, { name: name, address: address, open: open, anchorEl: anchorEl, banUser: banUser }));
};
exports.ModeratorActionsPopper = ModeratorActionsPopper;
exports.default = (0, react_redux_1.connect)(null, exports.mapDispatchToProps)(exports.ModeratorActionsPopper);
