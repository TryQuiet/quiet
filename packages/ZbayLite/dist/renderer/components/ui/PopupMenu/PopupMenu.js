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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PopupMenu = void 0;
const react_1 = __importStar(require("react"));
const classnames_1 = __importDefault(require("classnames"));
const Popper_1 = __importDefault(require("@material-ui/core/Popper"));
const Grow_1 = __importDefault(require("@material-ui/core/Grow"));
const Paper_1 = __importDefault(require("@material-ui/core/Paper"));
const styles_1 = require("@material-ui/core/styles");
const constants = {
    arrowSize: 10
};
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    wrapper: {},
    paper: {
        background: theme.palette.background.default,
        boxShadow: '0px 2px 25px rgba(0, 0, 0, 0.2)',
        borderRadius: 8
    },
    arrow: {
        opacity: 1,
        position: 'absolute',
        width: 2 * constants.arrowSize,
        height: 2 * constants.arrowSize,
        '&::before': {
            content: '""',
            margin: 'auto',
            display: 'block',
            width: 0,
            height: 0,
            borderStyle: 'solid'
        }
    },
    bottom: {
        top: 0,
        marginTop: `-${constants.arrowSize}px`,
        '&::before': {
            borderWidth: `0 ${constants.arrowSize}px ${constants.arrowSize}px ${constants.arrowSize}px`,
            borderColor: `transparent transparent ${theme.palette.background.default} transparent`
        }
    },
    top: {
        bottom: 0,
        marginBottom: `-${2 * constants.arrowSize}px`,
        '&::before': {
            borderWidth: `${constants.arrowSize}px ${constants.arrowSize}px 0 ${constants.arrowSize}px`,
            borderColor: `${theme.palette.background.default} transparent transparent transparent`
        }
    },
    popper: {
        zIndex: 100
    }
}));
const PopupMenu = ({ open = false, anchorEl, children, className = '', offset = 0, placement = 'bottom-end' }) => {
    const classes = useStyles({});
    const arrowRef = (0, react_1.useRef)(null);
    return (react_1.default.createElement(Popper_1.default, { open: open, anchorEl: anchorEl, transition: true, placement: placement, disablePortal: true, className: classes.popper, modifiers: {
            arrow: {
                enabled: Boolean(arrowRef.current),
                element: arrowRef.current
            },
            offset: {
                offset
            }
        } }, ({ TransitionProps, placement }) => {
        const splitPlacement = placement.split('-')[0];
        return (react_1.default.createElement(Grow_1.default, Object.assign({}, TransitionProps, { style: {
                transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom'
            } }),
            react_1.default.createElement("div", { className: classes.wrapper },
                react_1.default.createElement(Paper_1.default, { className: (0, classnames_1.default)({
                        [classes.paper]: true,
                        [className]: className
                    }) }, children),
                react_1.default.createElement("span", { className: (0, classnames_1.default)({
                        [classes[splitPlacement]]: true
                    }), ref: arrowRef }))));
    }));
};
exports.PopupMenu = PopupMenu;
exports.default = exports.PopupMenu;
