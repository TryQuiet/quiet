"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IconButton = void 0;
const react_1 = __importDefault(require("react"));
const IconButton_1 = __importDefault(require("@material-ui/core/IconButton"));
const styles_1 = require("@material-ui/core/styles");
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    root: {
        padding: 6,
        color: theme.typography.body1.color
    }
}));
const IconButton = ({ children, onClick }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(IconButton_1.default, { classes: { root: classes.root }, onClick: onClick }, children));
};
exports.IconButton = IconButton;
exports.default = exports.IconButton;
