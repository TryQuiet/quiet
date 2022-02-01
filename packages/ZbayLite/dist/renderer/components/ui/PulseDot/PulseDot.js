"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PulseDot = void 0;
const react_1 = __importDefault(require("react"));
const classnames_1 = __importDefault(require("classnames"));
const red_1 = __importDefault(require("@material-ui/core/colors/red"));
const blue_1 = __importDefault(require("@material-ui/core/colors/blue"));
const amber_1 = __importDefault(require("@material-ui/core/colors/amber"));
const lightGreen_1 = __importDefault(require("@material-ui/core/colors/lightGreen"));
const styles_1 = require("@material-ui/core/styles");
const useStyles = (0, styles_1.makeStyles)(({ size }) => ({
    '@keyframes pulse': {
        '0%': {
            transform: 'scale(1)',
            opacity: 0
        },
        '70%': {
            transform: 'scale(1.6)',
            opacity: 1
        },
        '100%': {
            transform: 'scale(2)',
            opacity: 0
        }
    },
    root: {
        display: 'inline-block',
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        zIndex: 2,
        borderRadius: '50%',
        '&:after': {
            content: '""',
            zIndex: 1,
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            opacity: 0,
            animation: '$pulse 2s infinite'
        }
    },
    healthy: {
        background: lightGreen_1.default[600],
        '&:after': {
            background: `${lightGreen_1.default[500]}77`
        }
    },
    syncing: {
        background: blue_1.default[500],
        '&:after': {
            background: `${blue_1.default[500]}77`
        }
    },
    connecting: {
        background: blue_1.default[500],
        '&:after': {
            background: `${blue_1.default[500]}77`
        }
    },
    restarting: {
        background: amber_1.default[500],
        '&:after': {
            background: `${amber_1.default[500]}77`
        }
    },
    down: {
        background: red_1.default[500],
        '&:after': {
            background: `${red_1.default[500]}77`
        }
    }
}));
const PulseDot = ({ className = '', size = 16, color }) => {
    const classes = useStyles({ size });
    return (react_1.default.createElement("div", { className: (0, classnames_1.default)({
            [classes.root]: true,
            [classes[color]]: color,
            [className]: className
        }), style: {
            width: size,
            height: size
        } }));
};
exports.PulseDot = PulseDot;
exports.default = exports.PulseDot;
