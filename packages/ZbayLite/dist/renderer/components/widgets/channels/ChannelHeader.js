"use strict";
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
exports.ChannelHeaderComponent = void 0;
const react_1 = __importDefault(require("react"));
const classnames_1 = __importDefault(require("classnames"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const styles_1 = require("@material-ui/core/styles");
const Icon_1 = __importDefault(require("../../ui/Icon/Icon"));
const silenced_svg_1 = __importDefault(require("../../../static/images/silenced.svg"));
const silencedBlack_svg_1 = __importDefault(require("../../../static/images/silencedBlack.svg"));
const Tooltip_1 = __importDefault(require("../../ui/Tooltip/Tooltip"));
const useStyles = (0, styles_1.makeStyles)(theme => ({
    root: {
        height: '75px',
        paddingLeft: 20,
        paddingRight: 24,
        borderBottom: `1px solid ${theme.palette.colors.veryLightGray}`
    },
    title: {
        fontSize: '1rem',
        lineHeight: '1.66'
    },
    subtitle: {
        fontSize: '0.8rem'
    },
    spendButton: {
        fontSize: 13
    },
    actions: {},
    switch: {
        maxWidth: 138,
        marginRight: 18,
        borderRadius: 4,
        borderStyle: 'solid',
        borderColor: theme.palette.colors.gray03
    },
    tab: {
        fontSize: 12,
        minHeight: 22,
        width: 65,
        minWidth: 0,
        lineHeight: '18px',
        padding: 0,
        textTransform: 'none',
        backgroundColor: theme.palette.colors.gray03,
        color: theme.palette.colors.gray40,
        fontWeight: 'normal'
    },
    tabs: {
        minHeight: 0
    },
    selected: {
        color: theme.palette.colors.trueBlack,
        backgroundColor: theme.palette.colors.white
    },
    indicator: {
        maxHeight: 0
    },
    descriptionDiv: {
        top: 75,
        padding: '12px 25px 12px 20px',
        backgroundColor: theme.palette.colors.white,
        boxShadow: `0px 1px 0px ${theme.palette.colors.veryLightGray}`
    },
    wrapper: {},
    iconDiv: {
        marginLeft: 12
    },
    iconButton: {
        padding: 0
    },
    bold: {
        fontWeight: 500
    },
    silenceDiv: {
        width: 20,
        height: 20,
        marginLeft: 11,
        cursor: 'pointer'
    }
}));
const ChannelHeaderComponent = (_a) => {
    var _b;
    var { channel } = _a, channelMenuActionProps = __rest(_a, ["channel"]);
    const classes = useStyles({});
    const debounce = (fn, ms) => {
        let timer;
        return (_) => {
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(_ => {
                timer = null;
                fn.apply(this);
            }, ms);
        };
    };
    const [silenceHover, setSilenceHover] = react_1.default.useState(false);
    const [wrapperWidth, setWrapperWidth] = react_1.default.useState(0);
    react_1.default.useEffect(() => {
        setWrapperWidth(window.innerWidth - 300);
    });
    react_1.default.useEffect(() => {
        const handleResize = debounce(function handleResize() {
            setWrapperWidth(window.innerWidth - 300);
        }, 200);
        window.addEventListener('resize', handleResize);
        return window.removeEventListener('resize', handleResize);
    });
    return (react_1.default.createElement("div", { className: classes.wrapper },
        react_1.default.createElement(Grid_1.default, { container: true, className: classes.root, justify: 'space-between', alignItems: 'center', direction: 'row' },
            react_1.default.createElement(Grid_1.default, { item: true },
                react_1.default.createElement(Grid_1.default, { item: true, container: true, alignItems: 'center' },
                    react_1.default.createElement(Grid_1.default, { item: true },
                        react_1.default.createElement(Typography_1.default, { noWrap: true, style: { maxWidth: wrapperWidth }, variant: 'subtitle1', className: (0, classnames_1.default)({
                                [classes.title]: true,
                                [classes.bold]: true
                            }), "data-testid": 'channelTitle' }, `#${(_b = channel === null || channel === void 0 ? void 0 : channel.name) === null || _b === void 0 ? void 0 : _b.substring(0, 20)}`)),
                    channelMenuActionProps.mutedFlag && (react_1.default.createElement(Tooltip_1.default, { placement: 'bottom', title: 'Unmute' },
                        react_1.default.createElement(Grid_1.default, { item: true, className: classes.silenceDiv, onMouseEnter: () => setSilenceHover(true), onMouseLeave: () => setSilenceHover(false), onClick: () => {
                                channelMenuActionProps.onUnmute();
                            } },
                            react_1.default.createElement(Icon_1.default, { src: silenceHover ? silencedBlack_svg_1.default : silenced_svg_1.default })))))),
            react_1.default.createElement(Grid_1.default, { item: true, xs: true, container: true, className: classes.actions, justify: 'flex-end', alignContent: 'center', alignItems: 'center' },
                react_1.default.createElement(Grid_1.default, { item: true })))));
};
exports.ChannelHeaderComponent = ChannelHeaderComponent;
exports.default = exports.ChannelHeaderComponent;
