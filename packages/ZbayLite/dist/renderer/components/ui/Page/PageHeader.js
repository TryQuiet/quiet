"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageHeader = void 0;
const react_1 = __importDefault(require("react"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const styles_1 = require("@material-ui/core/styles");
const useStyles = (0, styles_1.makeStyles)(theme => ({
    root: {
        background: theme.palette.colors.white,
        order: -1,
        zIndex: 10,
        WebkitAppRegion: process.platform === 'win32' ? 'no-drag' : 'drag'
    }
}));
const PageHeader = ({ children }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(Grid_1.default, { item: true, className: classes.root }, children));
};
exports.PageHeader = PageHeader;
exports.default = exports.PageHeader;
