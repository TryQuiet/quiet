"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnackbarContent = void 0;
const react_1 = __importDefault(require("react"));
const classnames_1 = __importDefault(require("classnames"));
const styles_1 = require("@material-ui/core/styles");
const IconButton_1 = __importDefault(require("@material-ui/core/IconButton"));
const CircularProgress_1 = __importDefault(require("@material-ui/core/CircularProgress"));
const SnackbarContent_1 = __importDefault(require("@material-ui/core/SnackbarContent"));
const Close_1 = __importDefault(require("@material-ui/icons/Close"));
const CheckCircle_1 = __importDefault(require("@material-ui/icons/CheckCircle"));
const Error_1 = __importDefault(require("@material-ui/icons/Error"));
const Info_1 = __importDefault(require("@material-ui/icons/Info"));
const Warning_1 = __importDefault(require("@material-ui/icons/Warning"));
const green_1 = __importDefault(require("@material-ui/core/colors/green"));
const blue_1 = __importDefault(require("@material-ui/core/colors/blue"));
const amber_1 = __importDefault(require("@material-ui/core/colors/amber"));
const useStyles = (0, styles_1.makeStyles)(theme => ({
    close: {
        padding: theme.spacing(0.5),
        margin: 0
    },
    success: {
        backgroundColor: green_1.default[600]
    },
    error: {
        backgroundColor: theme.palette.error.dark
    },
    info: {
        backgroundColor: blue_1.default[600]
    },
    loading: {
        backgroundColor: blue_1.default[400],
        color: '#fff'
    },
    loadingIcon: {
        color: '#fff',
        opacity: 1
    },
    warning: {
        backgroundColor: amber_1.default[700]
    },
    fullWidth: {
        'max-width': 'none',
        'flex-grow': 1
    },
    icon: {
        fontSize: 20,
        opacity: 0.9
    },
    content: {
        display: 'flex',
        alignItems: 'center'
    },
    message: {
        paddingLeft: theme.spacing(2)
    }
}));
const iconVariants = {
    success: CheckCircle_1.default,
    warning: Warning_1.default,
    error: Error_1.default,
    info: Info_1.default,
    loading: CircularProgress_1.default
};
const SnackbarContent = ({ message, variant, onClose, fullWidth = false }) => {
    const classes = useStyles({});
    const Icon = iconVariants[variant];
    const closeAction = (react_1.default.createElement(IconButton_1.default, { key: 'close', color: 'inherit', className: classes.close, onClick: onClose },
        react_1.default.createElement(Close_1.default, { className: classes.icon })));
    const action = variant !== 'loading' ? [closeAction] : [];
    const variantIcon = `${variant}Icon`;
    return (react_1.default.createElement(SnackbarContent_1.default, { className: (0, classnames_1.default)({
            [classes[variant]]: true,
            [classes.fullWidth]: fullWidth
        }), message: react_1.default.createElement("span", { className: classes.content },
            react_1.default.createElement(Icon, { className: (0, classnames_1.default)(classes.icon, classes[variantIcon]), size: 20 }),
            react_1.default.createElement("span", { className: classes.message }, message)), action: action }));
};
exports.SnackbarContent = SnackbarContent;
exports.default = exports.SnackbarContent;
