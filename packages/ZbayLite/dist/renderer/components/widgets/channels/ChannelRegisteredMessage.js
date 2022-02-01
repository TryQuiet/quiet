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
exports.ChannelRegisteredMessage = void 0;
const react_1 = __importStar(require("react"));
const styles_1 = require("@material-ui/core/styles");
const SendMessagePopover_1 = __importDefault(require("../../../containers/widgets/channels/SendMessagePopover"));
const WelcomeMessage_1 = __importDefault(require("./WelcomeMessage"));
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    nickname: {
        fontWeight: 'bold',
        cursor: 'pointer'
    },
    link: {
        color: theme.palette.colors.lushSky,
        backgroundColor: theme.palette.colors.lushSky12,
        borderRadius: 4,
        cursor: 'pointer'
    }
}));
const ChannelRegisteredMessage = ({ message, username, onChannelClick }) => {
    const classes = useStyles({});
    const [anchorEl, setAnchorEl] = react_1.default.useState(null);
    const handleClick = event => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => setAnchorEl(null);
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(WelcomeMessage_1.default, { message: react_1.default.createElement(react_1.Fragment, null,
                react_1.default.createElement("span", { className: classes.nickname, onClick: handleClick }, username),
                react_1.default.createElement("span", null,
                    ' ',
                    "just published",
                    ' ',
                    react_1.default.createElement("span", { className: classes.link, onClick: onChannelClick },
                        "#",
                        message.nickname),
                    ' ',
                    "on zbay!")), timestamp: String(message.createdAt) }),
        react_1.default.createElement(SendMessagePopover_1.default, { username: username, anchorEl: anchorEl, handleClose: handleClose })));
};
exports.ChannelRegisteredMessage = ChannelRegisteredMessage;
exports.default = exports.ChannelRegisteredMessage;
