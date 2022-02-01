"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadingButton = void 0;
const react_1 = __importDefault(require("react"));
const styles_1 = require("@material-ui/core/styles");
const Button_1 = __importDefault(require("@material-ui/core/Button"));
const CircularProgress_1 = __importDefault(require("@material-ui/core/CircularProgress"));
const classnames_1 = __importDefault(require("classnames"));
const useStyles = (0, styles_1.makeStyles)(theme => ({
    button: {
        maxWidth: 286,
        height: 60,
        backgroundColor: theme.palette.colors.zbayBlue,
        color: theme.palette.colors.white,
        '&:hover': {
            backgroundColor: theme.palette.colors.zbayBlue
        },
        '&:disabled': {
            opacity: 0.7
        }
    },
    inProgress: {
        '&:disabled': {
            backgroundColor: theme.palette.colors.zbayBlue,
            opacity: 1
        }
    },
    progress: {
        color: theme.palette.colors.white
    }
}));
const LoadingButton = (_a) => {
    var { inProgress = false, text = 'Continue', classes: customClasses } = _a, buttonProps = __rest(_a, ["inProgress", "text", "classes"]);
    const classes = Object.assign(Object.assign({}, useStyles({})), customClasses);
    return (react_1.default.createElement(Button_1.default, Object.assign({ className: (0, classnames_1.default)(classes.button, { [classes.inProgress]: inProgress }) }, buttonProps), inProgress ? react_1.default.createElement(CircularProgress_1.default, { className: classes.progress }) : text));
};
exports.LoadingButton = LoadingButton;
exports.default = exports.LoadingButton;
