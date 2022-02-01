"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickActionLayout = void 0;
const react_1 = __importDefault(require("react"));
const Clear_1 = __importDefault(require("@material-ui/icons/Clear"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const Button_1 = __importDefault(require("@material-ui/core/Button"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const styles_1 = require("@material-ui/core/styles");
const IconButton_1 = __importDefault(require("../Icon/IconButton"));
const useStyles = (0, styles_1.makeStyles)(theme => ({
    alignAvatarPopover: {
        marginTop: theme.spacing(2)
    },
    button: {
        marginTop: theme.spacing(3),
        width: 260,
        height: 60,
        paddingTop: theme.spacing(1.2),
        paddingBottom: theme.spacing(1.2),
        paddingLeft: theme.spacing(1.6),
        paddingRight: theme.spacing(1.6),
        color: theme.palette.colors.white,
        fontSize: '0.9rem',
        backgroundColor: theme.palette.colors.purple,
        textTransform: 'none'
    },
    container: {
        height: 400,
        width: 320
    },
    usernamePopover: {
        marginTop: theme.spacing(1),
        fontSize: '1.2rem',
        fontWeight: 'bold'
    },
    closeIcon: {
        margin: theme.spacing(2)
    },
    info: {
        color: theme.palette.colors.zbayBlue
    },
    infoDiv: {
        textAlign: 'center',
        marginTop: theme.spacing(1.2),
        marginLeft: theme.spacing(4),
        marginRight: theme.spacing(4)
    },
    avatar: {
        marginTop: theme.spacing(2)
    }
}));
const QuickActionLayout = ({ main, info, children, handleClose, buttonName, warning, onClick }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(Grid_1.default, { container: true, className: classes.container, direction: 'column', justify: 'flex-start', alignItems: 'center' },
        react_1.default.createElement(Grid_1.default, { className: classes.closeIcon, container: true, item: true, direction: 'row', justify: 'flex-start' },
            react_1.default.createElement(IconButton_1.default, { onClick: handleClose },
                react_1.default.createElement(Clear_1.default, null))),
        react_1.default.createElement(Grid_1.default, { item: true, className: classes.avatar },
            react_1.default.createElement("span", { className: classes.alignAvatarPopover }, children)),
        react_1.default.createElement(Grid_1.default, { item: true },
            react_1.default.createElement(Typography_1.default, { color: 'textPrimary', className: classes.usernamePopover }, main)),
        react_1.default.createElement(Grid_1.default, { item: true },
            react_1.default.createElement(Typography_1.default, { className: classes.info, variant: 'caption' }, info)),
        react_1.default.createElement(Grid_1.default, { item: true },
            react_1.default.createElement(Button_1.default, { variant: 'contained', onClick: onClick, disabled: !!warning, className: classes.button }, buttonName)),
        react_1.default.createElement(Grid_1.default, { item: true, className: classes.infoDiv },
            react_1.default.createElement(Typography_1.default, { className: classes.info, variant: 'caption' }, warning))));
};
exports.QuickActionLayout = QuickActionLayout;
exports.default = exports.QuickActionLayout;
