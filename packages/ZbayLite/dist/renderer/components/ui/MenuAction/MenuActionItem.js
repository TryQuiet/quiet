"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuActionItem = void 0;
const react_1 = __importDefault(require("react"));
const MenuItem_1 = __importDefault(require("@material-ui/core/MenuItem"));
const styles_1 = require("@material-ui/core/styles");
const useStyles = (0, styles_1.makeStyles)(() => ({
    root: {
        minHeight: 25,
        margin: 0,
        fontSize: 14,
        letterSpacing: 0.4,
        paddingTop: 5,
        paddingBottom: 5
    }
}));
const MenuActionItem = ({ onClick, title, close, closeAfterAction = true }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(MenuItem_1.default, { onClick: e => {
            onClick(e);
            if (close) {
                closeAfterAction && close();
            }
        }, className: classes.root }, title));
};
exports.MenuActionItem = MenuActionItem;
exports.default = exports.MenuActionItem;
