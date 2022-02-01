"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelMessageActions = void 0;
const react_1 = __importDefault(require("react"));
const styles_1 = require("@material-ui/core/styles");
const core_1 = require("@material-ui/core");
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const Icon_1 = __importDefault(require("../../ui/Icon/Icon"));
const t_error_svg_1 = __importDefault(require("../../../static/images/t-error.svg"));
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    warrning: {
        marginLeft: 8,
        letterSpacing: 0.4,
        color: theme.palette.colors.error
    },
    tryAgain: {
        marginLeft: 4,
        letterSpacing: 0.4,
        color: theme.palette.colors.linkBlue,
        '&:hover': {
            color: theme.palette.colors.blue
        }
    },
    pointer: {
        cursor: 'pointer'
    }
}));
const ChannelMessageActions = ({ onResend }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(Grid_1.default, { container: true, direction: 'row', justify: 'flex-start', alignItems: 'center' }, react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(Icon_1.default, { src: t_error_svg_1.default }),
        react_1.default.createElement(Grid_1.default, { item: true },
            react_1.default.createElement(core_1.Typography, { variant: 'caption', className: classes.warrning }, "Coudn't send.")),
        react_1.default.createElement(Grid_1.default, { item: true, className: classes.pointer, onClick: onResend },
            react_1.default.createElement(core_1.Typography, { variant: 'caption', className: classes.tryAgain }, "Try again")))));
};
exports.ChannelMessageActions = ChannelMessageActions;
exports.default = exports.ChannelMessageActions;
