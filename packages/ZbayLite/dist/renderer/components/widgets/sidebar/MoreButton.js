"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoreButton = void 0;
const react_1 = __importDefault(require("react"));
const Button_1 = __importDefault(require("@material-ui/core/Button"));
const styles_1 = require("@material-ui/core/styles");
const core_1 = require("@material-ui/core");
const Tooltip_1 = __importDefault(require("../../ui/Tooltip/Tooltip"));
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    button: {
        padding: 0,
        paddingLeft: 16,
        textTransform: 'none',
        textAlign: 'left',
        justifyContent: 'start',
        '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.08)',
            opacity: 1
        },
        opacity: 0.7,
        color: theme.palette.colors.white
    },
    tooltip: {
        marginTop: 5
    }
}));
const MoreButton = ({ tooltipText, action }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(Tooltip_1.default, { title: tooltipText, className: classes.tooltip, placement: 'bottom' },
        react_1.default.createElement(Button_1.default, { fullWidth: true, variant: 'text', className: classes.button, onClick: action },
            react_1.default.createElement(core_1.Typography, { variant: 'body2' }, "more..."))));
};
exports.MoreButton = MoreButton;
exports.default = exports.MoreButton;
