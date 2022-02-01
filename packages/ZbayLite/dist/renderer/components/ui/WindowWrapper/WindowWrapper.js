"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowWrapper = void 0;
const react_1 = __importDefault(require("react"));
const classnames_1 = __importDefault(require("classnames"));
const styles_1 = require("@material-ui/core/styles");
const useStyles = (0, styles_1.makeStyles)(() => ({
    root: {},
    wrapper: {
        'min-height': '100vh'
    }
}));
const WindowWrapper = ({ children, className = '' }) => {
    const classes = useStyles({});
    return (react_1.default.createElement("div", { className: (0, classnames_1.default)({
            [classes.wrapper]: true,
            [className]: className
        }) }, children));
};
exports.WindowWrapper = WindowWrapper;
exports.default = exports.WindowWrapper;
