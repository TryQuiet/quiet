"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelSettingsModal = void 0;
const react_1 = __importDefault(require("react"));
const Tabs_1 = __importDefault(require("@material-ui/core/Tabs"));
const AppBar_1 = __importDefault(require("@material-ui/core/AppBar"));
const styles_1 = require("@material-ui/core/styles");
const core_1 = require("@material-ui/core");
const Modal_1 = __importDefault(require("../../ui/Modal/Modal"));
const Tab_1 = __importDefault(require("../../ui/Tab/Tab"));
const Moderators_1 = __importDefault(require("../../../containers/widgets/channelSettings/Moderators"));
const ChannelInfo_1 = __importDefault(require("../../../containers/widgets/channelSettings/ChannelInfo"));
const Notifications_1 = __importDefault(require("../../../containers/widgets/channelSettings/Notifications"));
const tabs = {
    channelInfo: ChannelInfo_1.default,
    moderators: Moderators_1.default,
    notifications: Notifications_1.default
};
const useStyles = (0, styles_1.makeStyles)(theme => ({
    root: {
        zIndex: 1000,
        paddingLeft: 20,
        paddingTop: 32,
        paddingRight: 32
    },
    tabs: {
        color: theme.palette.colors.trueBlack
    },
    indicator: {
        height: '0 !important'
    },
    appbar: {
        backgroundColor: theme.palette.colors.white,
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.0)'
    },
    disabled: {
        fontSize: 25,
        lineHeight: '15px',
        fontStyle: 'normal',
        fontWeight: 'normal'
    },
    tabsDiv: {
        width: 168
    },
    selected: {
        backgroundColor: theme.palette.colors.lushSky,
        borderRadius: 5,
        color: theme.palette.colors.white
    },
    tab: {
        minHeight: 32
    },
    content: {
        marginLeft: 32
    }
}));
const handleChange = (setCurrentTab, clearCurrentOpenTab, value) => {
    clearCurrentOpenTab();
    setCurrentTab(value);
};
const ChannelSettingsModal = ({ open, handleClose, currentTab, channel, isOwner, modalTabToOpen, setCurrentTab, clearCurrentOpenTab }) => {
    const classes = useStyles({});
    let TabComponent;
    if (isOwner) {
        TabComponent = tabs[modalTabToOpen || currentTab];
    }
    else {
        TabComponent = tabs.notifications;
    }
    return (react_1.default.createElement(Modal_1.default, { open: open, handleClose: handleClose, title: `Settings for #${channel.username}`, isBold: true, addBorder: true },
        react_1.default.createElement(core_1.Grid, { container: true, direction: 'row', className: classes.root },
            react_1.default.createElement(core_1.Grid, { item: true, className: classes.tabsDiv },
                react_1.default.createElement(AppBar_1.default, { position: 'static', className: classes.appbar },
                    react_1.default.createElement(Tabs_1.default, { value: isOwner ? modalTabToOpen || currentTab : 'notifications', 
                        // eslint-disable-next-line
                        onChange: (_e, value) => handleChange(setCurrentTab, clearCurrentOpenTab, value), orientation: 'vertical', className: classes.tabs, textColor: 'inherit', classes: { indicator: classes.indicator } },
                        isOwner && (react_1.default.createElement(Tab_1.default, { value: 'channelInfo', label: 'Channel info', classes: {
                                selected: classes.selected
                            } })),
                        isOwner && (react_1.default.createElement(Tab_1.default, { value: 'moderators', label: 'Moderators', classes: {
                                selected: classes.selected
                            } })),
                        react_1.default.createElement(Tab_1.default, { value: 'notifications', label: 'Notifications', classes: { selected: classes.selected } })))),
            react_1.default.createElement(core_1.Grid, { item: true, xs: true, className: classes.content },
                react_1.default.createElement(TabComponent, null)))));
};
exports.ChannelSettingsModal = ChannelSettingsModal;
exports.default = exports.ChannelSettingsModal;
