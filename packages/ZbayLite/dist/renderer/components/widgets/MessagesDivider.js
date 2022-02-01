"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesDivider = void 0;
const react_1 = __importDefault(require("react"));
const styles_1 = require("@material-ui/core/styles");
const core_1 = require("@material-ui/core");
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    root: {
        padding: 0
    },
    divider: {
        height: 1,
        backgroundColor: theme.palette.colors.veryLightGray
    },
    titleDiv: {
        paddingLeft: 12,
        paddingRight: 12
    }
}));
const MessagesDivider = ({ title }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(core_1.Grid, { container: true, justify: 'center', alignItems: 'center' },
        react_1.default.createElement(core_1.Grid, { item: true, xs: true },
            react_1.default.createElement("div", { className: classes.divider })),
        react_1.default.createElement(core_1.Grid, { item: true, className: classes.titleDiv },
            react_1.default.createElement(core_1.Typography, { variant: 'body1' }, title)),
        react_1.default.createElement(core_1.Grid, { item: true, xs: true },
            react_1.default.createElement("div", { className: classes.divider }))));
};
exports.MessagesDivider = MessagesDivider;
exports.default = exports.MessagesDivider;
