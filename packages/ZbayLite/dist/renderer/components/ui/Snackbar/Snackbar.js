"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Snackbar = void 0;
const react_1 = __importDefault(require("react"));
const classnames_1 = __importDefault(require("classnames"));
const styles_1 = require("@material-ui/core/styles");
const Snackbar_1 = __importDefault(require("@material-ui/core/Snackbar"));
const SnackbarContent_1 = __importDefault(require("./SnackbarContent"));
const useStyles = (0, styles_1.makeStyles)(() => ({
    fullWidthBottom: {
        left: 0,
        right: 0,
        bottom: 0
    },
    fullWidthTop: {
        left: 0,
        right: 0,
        bottom: 0
    }
}));
const Snackbar = ({ open, message, variant, onClose, position = { vertical: 'bottom', horizontal: 'left' }, fullWidth = false }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(Snackbar_1.default, { anchorOrigin: position, open: open, autoHideDuration: 6000, onClose: onClose, classes: {
            anchorOriginTopCenter: (0, classnames_1.default)({
                [classes.fullWidthTop]: fullWidth
            }),
            anchorOriginBottomCenter: (0, classnames_1.default)({
                [classes.fullWidthBottom]: fullWidth
            }),
            anchorOriginTopRight: (0, classnames_1.default)({
                [classes.fullWidthTop]: fullWidth
            }),
            anchorOriginBottomRight: (0, classnames_1.default)({
                [classes.fullWidthBottom]: fullWidth
            }),
            anchorOriginTopLeft: (0, classnames_1.default)({
                [classes.fullWidthTop]: fullWidth
            }),
            anchorOriginBottomLeft: (0, classnames_1.default)({
                [classes.fullWidthBottom]: fullWidth
            })
        } },
        react_1.default.createElement(SnackbarContent_1.default, { variant: variant, message: message, fullWidth: fullWidth, onClose: onClose })));
};
exports.Snackbar = Snackbar;
exports.default = exports.Snackbar;
