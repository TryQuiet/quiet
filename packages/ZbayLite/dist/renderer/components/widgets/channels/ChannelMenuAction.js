"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelMenuActionComponent = void 0;
const react_1 = __importDefault(require("react"));
const styles_1 = require("@material-ui/core/styles");
const core_1 = require("@material-ui/core");
const dots_icon_svg_1 = __importDefault(require("../../../static/images/zcash/dots-icon.svg"));
const MenuAction_1 = __importDefault(require("../../ui/MenuAction/MenuAction"));
const MenuActionItem_1 = __importDefault(require("../../ui/MenuAction/MenuActionItem"));
const ConfirmModal_1 = __importDefault(require("../channelSettings/ConfirmModal"));
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    menuList: {
        padding: `${theme.spacing(1.5)}px 0`
    },
    icon: {
        width: 30,
        height: 30
    },
    sublabel: {
        color: theme.palette.colors.darkGray,
        letterSpacing: 0.4,
        fontSize: 12,
        lineHeight: '18px'
    }
}));
const ChannelMenuActionComponent = ({ onInfo, onMute, onUnmute, onDelete, onSettings, mutedFlag, disableSettings = false, notificationFilter, openNotificationsTab }) => {
    const classes = useStyles({});
    const [openDialog, setOpenDialog] = react_1.default.useState(false);
    return (react_1.default.createElement(MenuAction_1.default, { icon: dots_icon_svg_1.default, iconHover: dots_icon_svg_1.default, offset: '0 8' },
        react_1.default.createElement(MenuActionItem_1.default, { onClick: onInfo, title: 'Info & Invites' }),
        react_1.default.createElement(MenuActionItem_1.default, { onClick: e => {
                e.preventDefault();
                setOpenDialog(true);
            }, closeAfterAction: false, title: 'Remove' }),
        !disableSettings ? (react_1.default.createElement(MenuActionItem_1.default, { onClick: onSettings, title: 'Settings' })) : (react_1.default.createElement("span", null)),
        !disableSettings ? (react_1.default.createElement(MenuActionItem_1.default, { onClick: () => {
                openNotificationsTab();
                onSettings();
            }, title: react_1.default.createElement(core_1.Grid, { container: true, direction: 'column' },
                react_1.default.createElement(core_1.Grid, { item: true }, "Notifications"),
                react_1.default.createElement(core_1.Grid, { item: true, className: classes.sublabel }, notificationFilter)) })) : (react_1.default.createElement("span", null)),
        react_1.default.createElement(MenuActionItem_1.default, { onClick: mutedFlag ? onUnmute : onMute, title: mutedFlag ? 'Unmute' : 'Mute' }),
        react_1.default.createElement(ConfirmModal_1.default, { open: openDialog, title: 'Are you sure you want to remove this channel?', actionName: 'Yes', cancelName: 'No', handleClose: () => setOpenDialog(false), handleAction: onDelete })));
};
exports.ChannelMenuActionComponent = ChannelMenuActionComponent;
exports.default = exports.ChannelMenuActionComponent;
