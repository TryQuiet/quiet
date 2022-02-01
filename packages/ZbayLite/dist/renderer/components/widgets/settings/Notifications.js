"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notifications = void 0;
const react_1 = __importDefault(require("react"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const styles_1 = require("@material-ui/core/styles");
const FormControlLabel_1 = __importDefault(require("@material-ui/core/FormControlLabel"));
const Checkbox_1 = __importDefault(require("@material-ui/core/Checkbox"));
const Icon_1 = __importDefault(require("../../ui/Icon/Icon"));
const radioChecked_svg_1 = __importDefault(require("../../../static/images/radioChecked.svg"));
const radioUnselected_svg_1 = __importDefault(require("../../../static/images/radioUnselected.svg"));
const static_1 = require("../../../../shared/static");
const sounds_1 = require("../../../../shared/sounds");
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    title: {},
    titleDiv: {
        marginBottom: 24
    },
    subtitle: {
        fontSize: 18,
        lineHeight: '27px'
    },
    radioDiv: {
        marginLeft: 4
    },
    radioSoundDiv: {},
    radioIcon: {
        alignItems: 'flex-start',
        '& .MuiCheckbox-root': {
            backgroundColor: 'transparent',
            '&:hover': {
                backgroundColor: 'transparent'
            },
            display: 'block'
        },
        '& .MuiIconButton-colorSecondary': {
            color: theme.palette.colors.zbayBlue
        },
        '& .MuiTypography-body1': {
            fontSize: '14px',
            lineHeight: '25px'
        }
    },
    bold: {
        fontWeight: 500
    },
    offset: {
        marginTop: 5
    },
    spacing: {
        marginTop: 16
    },
    radioSound: {
        '& .MuiCheckbox-root': {
            backgroundColor: 'transparent',
            '&:hover': {
                backgroundColor: 'transparent'
            },
            display: 'block'
        },
        marginLeft: 23,
        height: 24
    },
    subtitleSoundDiv: {
        marginTop: 40
    },
    label: {
        marginTop: 1,
        fontWeight: 500
    },
    spacingSound: {
        marginTop: 8
    }
}));
const Notifications = ({ userFilterType, setUserNotification, userSound, setUserNotificationsSound }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(Grid_1.default, { container: true, direction: 'column' },
        react_1.default.createElement(Grid_1.default, { container: true, item: true, justify: 'space-between', alignItems: 'center', className: classes.titleDiv },
            react_1.default.createElement(Grid_1.default, { item: true, className: classes.title },
                react_1.default.createElement(Typography_1.default, { variant: 'h3' }, "Notifications rgsdafasdf"))),
        react_1.default.createElement(Grid_1.default, { item: true },
            react_1.default.createElement(Typography_1.default, { variant: 'h5', className: classes.subtitle }, "Notify me about...")),
        react_1.default.createElement(Grid_1.default, { item: true, container: true, direction: 'column', className: classes.radioDiv },
            react_1.default.createElement(Grid_1.default, { item: true, className: classes.spacing },
                react_1.default.createElement(FormControlLabel_1.default, { classes: { root: classes.radioIcon }, control: react_1.default.createElement(Checkbox_1.default, { icon: react_1.default.createElement(Icon_1.default, { src: radioUnselected_svg_1.default }), checkedIcon: react_1.default.createElement(Icon_1.default, { src: radioChecked_svg_1.default }), checked: static_1.notificationFilterType.ALL_MESSAGES === userFilterType }), onChange: () => setUserNotification(static_1.notificationFilterType.ALL_MESSAGES), label: react_1.default.createElement(Grid_1.default, { container: true, direction: 'column', className: classes.offset },
                        react_1.default.createElement(Grid_1.default, { item: true },
                            react_1.default.createElement("span", { className: classes.bold }, "Every new message")),
                        react_1.default.createElement(Grid_1.default, { item: true },
                            react_1.default.createElement("span", null, "You\u2019ll be notified for every new message"))) }),
                ' '),
            react_1.default.createElement(Grid_1.default, { item: true, className: classes.spacing },
                react_1.default.createElement(FormControlLabel_1.default, { classes: { root: classes.radioIcon }, control: react_1.default.createElement(Checkbox_1.default, { icon: react_1.default.createElement(Icon_1.default, { src: radioUnselected_svg_1.default }), checkedIcon: react_1.default.createElement(Icon_1.default, { src: radioChecked_svg_1.default }), checked: static_1.notificationFilterType.MENTIONS === userFilterType }), onChange: () => setUserNotification(static_1.notificationFilterType.MENTIONS), label: react_1.default.createElement(Grid_1.default, { container: true, direction: 'column', className: classes.offset },
                        react_1.default.createElement(Grid_1.default, { item: true },
                            react_1.default.createElement("span", { className: classes.bold }, "Direct messages, mentions & keywords")),
                        react_1.default.createElement(Grid_1.default, { item: true },
                            react_1.default.createElement("span", null, "You\u2019ll be notified when someone mentions you or sends you a direct message."))) })),
            react_1.default.createElement(Grid_1.default, { item: true, className: classes.spacing },
                react_1.default.createElement(FormControlLabel_1.default, { classes: { root: classes.radioIcon }, control: react_1.default.createElement(Checkbox_1.default, { icon: react_1.default.createElement(Icon_1.default, { src: radioUnselected_svg_1.default }), checkedIcon: react_1.default.createElement(Icon_1.default, { src: radioChecked_svg_1.default }), checked: static_1.notificationFilterType.NONE === userFilterType }), onChange: () => setUserNotification(static_1.notificationFilterType.NONE), label: react_1.default.createElement(Grid_1.default, { container: true, direction: 'column', className: classes.offset },
                        react_1.default.createElement(Grid_1.default, { item: true },
                            react_1.default.createElement("span", { className: classes.bold }, "Nothing")),
                        react_1.default.createElement(Grid_1.default, { item: true },
                            react_1.default.createElement("span", null, "You won\u2019t receive notificaitons from Zbay."))) })),
            react_1.default.createElement(Grid_1.default, { item: true, className: classes.subtitleSoundDiv },
                react_1.default.createElement(Typography_1.default, { variant: 'h5', className: classes.subtitle }, "Sounds")),
            react_1.default.createElement(Grid_1.default, { item: true, container: true, direction: 'column', className: classes.radioSoundDiv },
                react_1.default.createElement(Grid_1.default, { item: true },
                    react_1.default.createElement(FormControlLabel_1.default, { control: react_1.default.createElement(Checkbox_1.default, { checked: userSound !== static_1.soundType.NONE, onChange: e => {
                                if (e.target.checked) {
                                    setUserNotificationsSound(static_1.soundType.POW);
                                }
                                else {
                                    setUserNotificationsSound(static_1.soundType.NONE);
                                }
                            }, color: 'default' }), label: react_1.default.createElement(Typography_1.default, { variant: 'body2', className: classes.label }, "Play a sound when receiving a notification") })),
                react_1.default.createElement(Grid_1.default, { item: true, className: classes.spacingSound },
                    react_1.default.createElement(FormControlLabel_1.default, { classes: { root: classes.radioSound }, control: react_1.default.createElement(Checkbox_1.default, { icon: react_1.default.createElement(Icon_1.default, { src: radioUnselected_svg_1.default }), checkedIcon: react_1.default.createElement(Icon_1.default, { src: radioChecked_svg_1.default }), checked: static_1.soundType.POW === userSound }), onChange: () => {
                            setUserNotificationsSound(static_1.soundType.POW);
                            void sounds_1.direct.play();
                        }, label: 'Pow' })),
                react_1.default.createElement(Grid_1.default, { item: true, className: classes.spacingSound },
                    react_1.default.createElement(FormControlLabel_1.default, { classes: { root: classes.radioSound }, control: react_1.default.createElement(Checkbox_1.default, { icon: react_1.default.createElement(Icon_1.default, { src: radioUnselected_svg_1.default }), checkedIcon: react_1.default.createElement(Icon_1.default, { src: radioChecked_svg_1.default }), checked: static_1.soundType.BANG === userSound }), onChange: () => {
                            void sounds_1.sharp.play();
                            setUserNotificationsSound(static_1.soundType.BANG);
                        }, label: 'Bang' })),
                react_1.default.createElement(Grid_1.default, { item: true, className: classes.spacingSound },
                    react_1.default.createElement(FormControlLabel_1.default, { classes: { root: classes.radioSound }, control: react_1.default.createElement(Checkbox_1.default, { icon: react_1.default.createElement(Icon_1.default, { src: radioUnselected_svg_1.default }), checkedIcon: react_1.default.createElement(Icon_1.default, { src: radioChecked_svg_1.default }), checked: static_1.soundType.SPLAT === userSound }), onChange: () => {
                            void sounds_1.relentless.play();
                            setUserNotificationsSound(static_1.soundType.SPLAT);
                        }, label: 'Splat' }))))));
};
exports.Notifications = Notifications;
exports.default = exports.Notifications;
