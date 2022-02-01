"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notifications = void 0;
const react_1 = __importDefault(require("react"));
const react_virtualized_1 = require("react-virtualized");
const rc_scrollbars_1 = require("rc-scrollbars");
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const styles_1 = require("@material-ui/core/styles");
const FormControlLabel_1 = __importDefault(require("@material-ui/core/FormControlLabel"));
const Checkbox_1 = __importDefault(require("@material-ui/core/Checkbox"));
const Button_1 = __importDefault(require("@material-ui/core/Button"));
const Icon_1 = __importDefault(require("../../ui/Icon/Icon"));
const radioChecked_svg_1 = __importDefault(require("../../../static/images/radioChecked.svg"));
const radioUnselected_svg_1 = __importDefault(require("../../../static/images/radioUnselected.svg"));
const static_1 = require("../../../../shared/static");
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    title: {},
    addModerator: {
        color: theme.palette.colors.lushSky,
        '&:hover': {
            color: theme.palette.colors.trueBlack
        },
        cursor: 'pointer'
    },
    titleDiv: {
        marginBottom: 0
    },
    channelNameDiv: {
        marginBottom: 24
    },
    radioDiv: {
        marginLeft: 4
    },
    radioIcon: {
        '& .MuiCheckbox-root': {
            backgroundColor: 'transparent',
            '&:hover': {
                backgroundColor: 'transparent'
            }
        },
        '& .MuiIconButton-colorSecondary': {
            color: theme.palette.colors.zbayBlue
        },
        '& .MuiTypography-body1': {
            fontSize: '14px',
            lineHeight: '25px'
        }
    },
    infoDiv: {
        marginTop: 5
    },
    button: {
        marginTop: 14,
        height: 60,
        width: 180,
        fontSize: 16,
        backgroundColor: theme.palette.colors.zbayBlue
    },
    captionDiv: {
        marginTop: 16
    },
    captions: {
        color: theme.palette.colors.darkGray,
        lineHeight: '20px'
    },
    link: {
        cursor: 'pointer',
        color: theme.palette.colors.lushSky
    }
}));
const Notifications = ({ currentFilter, setChannelsNotification, channelData, openNotificationsTab, openSettingsModal }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(react_virtualized_1.AutoSizer, null, ({ width, height }) => (react_1.default.createElement(rc_scrollbars_1.Scrollbars, { autoHideTimeout: 500, style: { width: width, height: height, overflowX: 'hidden' } },
        react_1.default.createElement(Grid_1.default, { container: true, direction: 'column' },
            react_1.default.createElement(Grid_1.default, { container: true, direction: 'column', item: true, justify: 'space-between', alignItems: 'center', className: classes.titleDiv },
                react_1.default.createElement(Grid_1.default, { item: true, className: classes.title },
                    react_1.default.createElement(Typography_1.default, { variant: 'h3' }, "Notifications"))),
            react_1.default.createElement(Grid_1.default, { item: true, className: classes.channelNameDiv },
                react_1.default.createElement(Typography_1.default, { variant: 'body2' },
                    "#",
                    channelData.username)),
            currentFilter !== static_1.notificationFilterType.MUTE ? (react_1.default.createElement(Grid_1.default, { item: true, container: true, direction: 'column', className: classes.radioDiv },
                react_1.default.createElement(FormControlLabel_1.default, { classes: { root: classes.radioIcon }, control: react_1.default.createElement(Checkbox_1.default, { icon: react_1.default.createElement(Icon_1.default, { src: radioUnselected_svg_1.default }), checkedIcon: react_1.default.createElement(Icon_1.default, { src: radioChecked_svg_1.default }), checked: static_1.notificationFilterType.ALL_MESSAGES === currentFilter }), onChange: () => setChannelsNotification(static_1.notificationFilterType.ALL_MESSAGES), label: 'Every new message' }),
                react_1.default.createElement(FormControlLabel_1.default, { classes: { root: classes.radioIcon }, control: react_1.default.createElement(Checkbox_1.default, { icon: react_1.default.createElement(Icon_1.default, { src: radioUnselected_svg_1.default }), checkedIcon: react_1.default.createElement(Icon_1.default, { src: radioChecked_svg_1.default }), checked: static_1.notificationFilterType.MENTIONS === currentFilter }), onChange: () => setChannelsNotification(static_1.notificationFilterType.MENTIONS), label: 'Just @mentions' }),
                react_1.default.createElement(FormControlLabel_1.default, { classes: { root: classes.radioIcon }, control: react_1.default.createElement(Checkbox_1.default, { icon: react_1.default.createElement(Icon_1.default, { src: radioUnselected_svg_1.default }), checkedIcon: react_1.default.createElement(Icon_1.default, { src: radioChecked_svg_1.default }), checked: static_1.notificationFilterType.NONE === currentFilter }), onChange: () => setChannelsNotification(static_1.notificationFilterType.NONE), label: 'Nothing' }))) : (react_1.default.createElement(Grid_1.default, { item: true, container: true, direction: 'column' },
                react_1.default.createElement(Grid_1.default, { item: true },
                    react_1.default.createElement(Typography_1.default, { variant: 'h4' }, "You've muted this channel")),
                react_1.default.createElement(Grid_1.default, { item: true, className: classes.infoDiv },
                    react_1.default.createElement(Typography_1.default, { variant: 'body2' }, "Unmute this channel to change your notification settings.")),
                react_1.default.createElement(Grid_1.default, null,
                    react_1.default.createElement(Button_1.default, { variant: 'contained', size: 'large', color: 'primary', type: 'submit', fullWidth: true, className: classes.button, onClick: () => {
                            setChannelsNotification(static_1.notificationFilterType.ALL_MESSAGES);
                        } }, "Unmute Channel")))),
            react_1.default.createElement(Grid_1.default, { item: true, className: classes.captionDiv },
                react_1.default.createElement(Typography_1.default, { variant: 'caption', className: classes.captions },
                    "You can choose how to be alerted or turn off all Zbay notifications in your",
                    ' ',
                    react_1.default.createElement("span", { className: classes.link, onClick: () => {
                            openSettingsModal();
                            openNotificationsTab();
                        } }, "Notification Settings"),
                    ".")))))));
};
exports.Notifications = Notifications;
exports.default = exports.Notifications;
