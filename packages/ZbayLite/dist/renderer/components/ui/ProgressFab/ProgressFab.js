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
exports.ProgressFab = void 0;
const react_1 = __importDefault(require("react"));
const classnames_1 = __importDefault(require("classnames"));
const Fab_1 = __importDefault(require("@material-ui/core/Fab"));
const CircularProgress_1 = __importDefault(require("@material-ui/core/CircularProgress"));
const green_1 = __importDefault(require("@material-ui/core/colors/green"));
const Check_1 = __importDefault(require("@material-ui/icons/Check"));
const styles_1 = require("@material-ui/core/styles");
const useStyles = (0, styles_1.makeStyles)(() => ({
    root: {
        backgroundColor: '#8d8d8d',
        color: '#fff',
        '&:hover': {
            backgroundColor: '#737373'
        }
    },
    fabProgress: {
        color: green_1.default[500],
        position: 'absolute',
        left: -6,
        top: -6,
        zIndex: 1
    },
    wrapper: {
        position: 'relative'
    },
    buttonSuccess: {
        '&:disabled': {
            backgroundColor: green_1.default[500],
            color: '#fff'
        }
    }
}));
const ProgressFab = (_a) => {
    var { className = '', children, loading = false, success = false, disabled = false, onClick } = _a, props = __rest(_a, ["className", "children", "loading", "success", "disabled", "onClick"]);
    const classes = useStyles({});
    return (react_1.default.createElement("div", { className: (0, classnames_1.default)({
            [classes.wrapper]: true,
            [className]: className
        }) },
        react_1.default.createElement(Fab_1.default, Object.assign({ classes: {
                root: (0, classnames_1.default)({
                    [classes.root]: true,
                    [classes.buttonSuccess]: success
                })
            }, onClick: onClick, disabled: disabled }, props), success ? react_1.default.createElement(Check_1.default, null) : children),
        loading && react_1.default.createElement(CircularProgress_1.default, { size: 68, className: classes.fabProgress })));
};
exports.ProgressFab = ProgressFab;
exports.default = exports.ProgressFab;
