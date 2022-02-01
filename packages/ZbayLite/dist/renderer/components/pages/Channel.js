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
exports.ChannelComponent = void 0;
const react_1 = __importStar(require("react"));
const styles_1 = require("@material-ui/core/styles");
const core_1 = require("@material-ui/core");
const Page_1 = __importDefault(require("../ui/Page/Page"));
const PageHeader_1 = __importDefault(require("../ui/Page/PageHeader"));
const ChannelHeader_1 = __importDefault(require("../widgets/channels/ChannelHeader"));
const ChannelMessages_1 = __importDefault(require("../widgets/channels/ChannelMessages"));
const ChannelInput_1 = __importDefault(require("../widgets/channels/ChannelInput"));
const useStyles = (0, styles_1.makeStyles)(theme => ({
    root: {},
    messages: {
        height: 0,
        backgroundColor: theme.palette.colors.white
    }
}));
const ChannelComponent = ({ user, channel, channelInfoModal, channelSettingsModal, messages, setChannelLoadingSlice, onDelete, onInputChange, onInputEnter, mutedFlag, disableSettings = false, notificationFilter, openNotificationsTab }) => {
    const classes = useStyles({});
    const [infoClass, setInfoClass] = (0, react_1.useState)(null);
    return (react_1.default.createElement(Page_1.default, null,
        react_1.default.createElement(PageHeader_1.default, null,
            react_1.default.createElement(ChannelHeader_1.default, { channel: channel, onSettings: channelSettingsModal.handleOpen, onInfo: channelInfoModal.handleOpen, onDelete: onDelete, mutedFlag: mutedFlag, disableSettings: disableSettings, notificationFilter: notificationFilter, openNotificationsTab: openNotificationsTab })),
        react_1.default.createElement(core_1.Grid, { item: true, xs: true, className: classes.messages },
            react_1.default.createElement(ChannelMessages_1.default, { channel: channel.address, messages: messages, setChannelLoadingSlice: setChannelLoadingSlice })),
        react_1.default.createElement(core_1.Grid, { item: true },
            react_1.default.createElement(ChannelInput_1.default, { channelAddress: channel.address, channelName: channel.name, 
                // TODO https://github.com/ZbayApp/ZbayLite/issues/443
                inputPlaceholder: `#${channel.name} as @${user === null || user === void 0 ? void 0 : user.zbayNickname}`, onChange: value => {
                    onInputChange(value);
                }, onKeyPress: message => {
                    onInputEnter(message);
                }, infoClass: infoClass, setInfoClass: setInfoClass }))));
};
exports.ChannelComponent = ChannelComponent;
exports.default = exports.ChannelComponent;
