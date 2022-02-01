"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.Tooltip = void 0;
const react_1 = __importStar(require("react"));
const classnames_1 = __importDefault(require("classnames"));
const Tooltip_1 = __importDefault(require("@material-ui/core/Tooltip"));
const styles_1 = require("@material-ui/core/styles");
function arrowGenerator(color, theme) {
    return {
        zIndex: 10,
        opacity: 1,
        '&[x-placement*="bottom"] $arrow': {
            opacity: 1,
            left: 0,
            marginTop: '-0.95em',
            '&::before': {
                borderWidth: '0 0.5em 0.5em 0.5em',
                borderColor: `transparent transparent ${color} transparent`
            }
        },
        '&[x-placement*="bottom-end"] $arrow': {
            opacity: 1,
            left: `calc(100% - ${theme.spacing(1)}px - ${constants.arrowSize}) !important`,
            marginTop: '-0.95em',
            '&::before': {
                borderWidth: '0 0.5em 0.5em 0.5em',
                borderColor: `transparent transparent ${color} transparent`
            }
        },
        '&[x-placement*="bottom-start"] $arrow': {
            opacity: 1,
            left: `${theme.spacing(1)}px !important`,
            marginTop: '-0.95em',
            '&::before': {
                borderWidth: '0 0.5em 0.5em 0.5em',
                borderColor: `transparent transparent ${color} transparent`
            }
        },
        '&[x-placement*="top"] $arrow': {
            top: 39,
            left: 0,
            marginBottom: '-0.95em',
            '&::before': {
                borderWidth: '0.5em 0.5em 0 0.5em',
                borderColor: `${color} transparent transparent transparent`
            }
        },
        '&[x-placement*="right"] $arrow': {
            left: 0,
            marginLeft: '-0.95em',
            '&::before': {
                borderWidth: '0.5em 0.5em 0.5em 0',
                borderColor: `transparent ${color} transparent transparent`
            }
        },
        '&[x-placement*="left"] $arrow': {
            right: 0,
            marginRight: '-0.95em',
            '&::before': {
                borderWidth: '0.5em 0 0.5em 0.5em',
                borderColor: `transparent transparent transparent ${color}`
            }
        }
    };
}
const constants = {
    arrowSize: '3em'
};
const usestyles = (0, styles_1.makeStyles)(theme => ({
    noWrap: {
        maxWidth: 'none',
        filter: 'drop-shadow(0 0 0px #aaaaaa)'
    },
    tooltip: {
        marginBottom: 5,
        background: theme.palette.colors.trueBlack,
        color: theme.typography.body1.color,
        paddingTop: 12,
        paddingBottom: 12,
        paddingLeft: 16,
        paddingRight: 16,
        borderRadius: 8
    },
    arrow: {
        position: 'absolute',
        width: constants.arrowSize,
        height: constants.arrowSize,
        top: '0.5em',
        '&::before': {
            content: '""',
            margin: 'auto',
            display: 'block',
            width: 0,
            height: 0,
            borderStyle: 'solid'
        }
    },
    text: {
        color: theme.palette.colors.white,
        fontSize: 12,
        fontWeight: 500
    },
    arrowPopper: arrowGenerator(theme.palette.colors.trueBlack, theme)
}));
const Tooltip = (_a) => {
    var { children, title, titleHTML, noWrap = false, interactive = false, className = '', placement = 'bottom', onClick = () => { } } = _a, props = __rest(_a, ["children", "title", "titleHTML", "noWrap", "interactive", "className", "placement", "onClick"]);
    const classes = usestyles({});
    const [arrowRef, setArrowRef] = (0, react_1.useState)(null);
    return (react_1.default.createElement("span", { onClick: e => onClick(e) },
        react_1.default.createElement(Tooltip_1.default, Object.assign({}, props, { title: react_1.default.createElement(react_1.default.Fragment, null,
                titleHTML || (react_1.default.createElement("span", { className: classes.text },
                    title ? title.charAt(0).toUpperCase() : '',
                    title ? title.slice(1) : '')),
                react_1.default.createElement("span", { className: classes.arrow, ref: setArrowRef })), classes: {
                tooltip: (0, classnames_1.default)({
                    [classes.noWrap]: noWrap,
                    [className]: className,
                    [classes.tooltip]: true
                }),
                popper: classes.arrowPopper
            }, PopperProps: {
                popperOptions: {
                    modifiers: {
                        arrow: {
                            enabled: Boolean(arrowRef),
                            element: arrowRef
                        }
                    }
                }
            } }), children)));
};
exports.Tooltip = Tooltip;
exports.default = exports.Tooltip;
