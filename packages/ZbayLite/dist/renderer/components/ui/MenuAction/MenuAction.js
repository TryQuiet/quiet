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
exports.MenuAction = void 0;
const react_1 = __importStar(require("react"));
const ClickAwayListener_1 = __importDefault(require("@material-ui/core/ClickAwayListener"));
const MenuList_1 = __importDefault(require("@material-ui/core/MenuList"));
const IconButton_1 = __importDefault(require("@material-ui/core/IconButton"));
const styles_1 = require("@material-ui/core/styles");
const Icon_1 = __importDefault(require("../Icon/Icon"));
const PopupMenu_1 = __importDefault(require("../PopupMenu/PopupMenu"));
const useStyles = (0, styles_1.makeStyles)(() => ({
    menuList: {
        paddingTop: 24,
        paddingBottom: 24,
        minWidth: 136,
        borderRadius: 8
    },
    icon: {},
    button: {}
}));
const RefIconButton = react_1.default.forwardRef((props, ref) => react_1.default.createElement(IconButton_1.default, Object.assign({}, props, { ref: ref })));
const MenuAction = ({ icon = IconButton_1.default, iconHover, children, offset, disabled = false, onClick, placement }) => {
    const classes = useStyles({});
    const [open, setOpen] = (0, react_1.useState)(false);
    const [hover, setHover] = (0, react_1.useState)(false);
    const toggleHover = () => setHover(!hover);
    const buttonRef = (0, react_1.useRef)(null);
    const [anchorEl, setAnchorEl] = react_1.default.useState(null);
    const closeMenu = () => {
        setAnchorEl(null);
        setOpen(false);
    };
    const toggleMenu = () => {
        setAnchorEl(buttonRef.current);
        setOpen(!open);
    };
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(RefIconButton, { className: classes.button, ref: buttonRef, onClick: onClick || toggleMenu, disabled: disabled, disableRipple: true, onMouseEnter: toggleHover, onMouseLeave: toggleHover },
            react_1.default.createElement(Icon_1.default, { className: classes.icon, src: hover ? iconHover : icon })),
        react_1.default.createElement(PopupMenu_1.default, { open: open, anchorEl: anchorEl, offset: offset, placement: placement },
            react_1.default.createElement(ClickAwayListener_1.default, { onClickAway: closeMenu },
                react_1.default.createElement(MenuList_1.default, { className: classes.menuList }, react_1.default.Children.map(children, child => react_1.default.cloneElement(child, { close: closeMenu })))))));
};
exports.MenuAction = MenuAction;
exports.default = exports.MenuAction;
