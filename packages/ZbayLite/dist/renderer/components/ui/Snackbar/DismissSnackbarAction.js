"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifierAction = exports.DismissSnackbarAction = void 0;
const react_1 = __importDefault(require("react"));
const notistack_1 = require("notistack");
const Button_1 = __importDefault(require("@material-ui/core/Button"));
const styles_1 = require("@material-ui/core/styles");
const useStyles = (0, styles_1.makeStyles)(theme => ({
    dismiss: {
        fontWeight: theme.typography.fontWeightMedium,
        color: '#fff'
    }
}));
const DismissSnackbarAction = ({ notificationKey }) => {
    const classes = useStyles({});
    const { closeSnackbar } = (0, notistack_1.useSnackbar)();
    return (react_1.default.createElement(Button_1.default, { onClick: () => {
            closeSnackbar(notificationKey);
        }, size: 'small', className: classes.dismiss }, "Dismiss"));
};
exports.DismissSnackbarAction = DismissSnackbarAction;
const notifierAction = (key) => react_1.default.createElement(exports.DismissSnackbarAction, { notificationKey: key });
exports.notifierAction = notifierAction;
exports.default = exports.DismissSnackbarAction;
