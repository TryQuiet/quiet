"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MentionPoper = void 0;
const react_1 = __importDefault(require("react"));
const rc_scrollbars_1 = require("rc-scrollbars");
const styles_1 = require("@material-ui/core/styles");
const Paper_1 = __importDefault(require("@material-ui/core/Paper"));
const Popper_1 = __importDefault(require("@material-ui/core/Popper"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
function isDivElement(element) {
    return (element === null || element === void 0 ? void 0 : element.nodeName) === 'div';
}
const maxHeight = 230;
const useStyles = (0, styles_1.makeStyles)({
    root: {
        maxHeight: maxHeight,
        width: 307,
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0px 2px 25px rgba(0,0,0,0.2)',
        marginBottom: 10
    },
    thumb: {
        backgroundColor: 'rgba(0,0,0,0.46)',
        borderRadius: 100,
        marginLeft: -3,
        width: 8
    },
    divider: {
        width: 14,
        borderLeft: '1px solid',
        borderColor: 'rgba(0,0,0,0.08)'
    }
});
const MentionPoper = ({ anchorEl, children, selected }) => {
    const classes = useStyles({});
    const anchor = react_1.default.useRef(null);
    const popperRef = react_1.default.useRef();
    const scrollbarRef = react_1.default.useRef(null);
    const [height, setHeight] = react_1.default.useState(0);
    const [positionY, setPositionY] = react_1.default.useState(0);
    const [positionX, setPositionX] = react_1.default.useState(0);
    react_1.default.useEffect(() => {
        if (anchorEl && popperRef.current) {
            if (children.length) {
                const popperContainer = popperRef.current;
                setPositionY(anchorEl.offsetTop - popperContainer.clientHeight);
                setPositionX(anchorEl.offsetLeft);
            }
            else {
                setPositionY(0);
                setPositionX(0);
            }
        }
    }, [children, anchorEl, popperRef]);
    react_1.default.useEffect(() => {
        if (anchor === null || anchor === void 0 ? void 0 : anchor.current) {
            if (anchor.current.clientHeight > maxHeight) {
                setHeight(maxHeight);
            }
            else {
                setHeight(anchor.current.clientHeight);
            }
        }
        else {
            setHeight(0);
        }
    }, [children]);
    react_1.default.useEffect(() => {
        var _a;
        const element = (_a = anchor.current) === null || _a === void 0 ? void 0 : _a.children[selected];
        if (isDivElement(element) && (scrollbarRef === null || scrollbarRef === void 0 ? void 0 : scrollbarRef.current)) {
            if (element.offsetTop >
                scrollbarRef.current.getScrollTop() + maxHeight - element.clientHeight) {
                scrollbarRef.current.scrollTop(element.offsetTop + element.clientHeight - maxHeight);
            }
            if (element.offsetTop < scrollbarRef.current.getScrollTop()) {
                scrollbarRef.current.scrollTop(element.offsetTop);
            }
        }
    }, [selected]);
    return (react_1.default.createElement(Popper_1.default, { open: true, className: classes.root, style: {
            transform: `translate3d(${positionX}px,${positionY}px,0px`,
            zIndex: positionX && positionY ? 0 : -1
        }, 
        // @ts-expect-error
        ref: popperRef },
        react_1.default.createElement(Paper_1.default, null,
            react_1.default.createElement(rc_scrollbars_1.Scrollbars, { ref: scrollbarRef, autoHideTimeout: 500, style: { height: height }, renderThumbVertical: () => react_1.default.createElement("div", { className: classes.thumb }) },
                react_1.default.createElement(Grid_1.default, null,
                    react_1.default.createElement(Grid_1.default, { container: true },
                        react_1.default.createElement(Grid_1.default, { item: true, xs: true, ref: anchor }, children),
                        react_1.default.createElement("div", { className: classes.divider })))))));
};
exports.MentionPoper = MentionPoper;
exports.default = exports.MentionPoper;
