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
exports.ChannelMessagesComponent = void 0;
const react_1 = __importStar(require("react"));
const styles_1 = require("@material-ui/core/styles");
const List_1 = __importDefault(require("@material-ui/core/List"));
const MessagesDivider_1 = __importDefault(require("../MessagesDivider"));
const BasicMessage_1 = __importDefault(require("./BasicMessage"));
const useStyles = (0, styles_1.makeStyles)(theme => ({
    scroll: {
        overflow: 'scroll',
        height: '100%'
    },
    list: {
        backgroundColor: theme.palette.colors.white,
        padding: '0 4px',
        width: '100%'
    },
    link: {
        color: theme.palette.colors.lushSky,
        cursor: 'pointer'
    },
    info: {
        color: theme.palette.colors.trueBlack,
        letterSpacing: '0.4px'
    },
    root: {
        width: '100%',
        padding: '8px 16px'
    },
    item: {
        backgroundColor: theme.palette.colors.gray03,
        padding: '9px 16px'
    },
    bold: {
        fontWeight: 'bold'
    }
}));
// TODO: scrollbar smart pagination
const ChannelMessagesComponent = ({ channel, messages = {
    count: 0,
    groups: {}
}, setChannelLoadingSlice = _value => { } }) => {
    const classes = useStyles({});
    const chunkSize = 50; // Should come from the configuration
    const [scrollPosition, setScrollPosition] = react_1.default.useState(-1);
    const [scrollHeight, setScrollHeight] = react_1.default.useState(0);
    const [messagesSlice, setMessagesSlice] = react_1.default.useState(0);
    const scrollbarRef = react_1.default.useRef();
    const messagesRef = react_1.default.useRef();
    const scrollBottom = () => {
        if (!scrollbarRef.current)
            return;
        scrollbarRef.current.scrollTop = scrollbarRef.current.scrollHeight;
    };
    /* Get scroll position and save it to the state as 0 (top), 1 (bottom) or -1 (middle) */
    const onScroll = react_1.default.useCallback(() => {
        var _a, _b, _c, _d;
        const top = ((_a = scrollbarRef.current) === null || _a === void 0 ? void 0 : _a.scrollTop) === 0;
        const bottom = ((_b = scrollbarRef.current) === null || _b === void 0 ? void 0 : _b.scrollHeight) - ((_c = scrollbarRef.current) === null || _c === void 0 ? void 0 : _c.scrollTop) ===
            ((_d = scrollbarRef.current) === null || _d === void 0 ? void 0 : _d.clientHeight);
        let position = -1;
        if (top)
            position = 0;
        if (bottom)
            position = 1;
        setScrollPosition(position);
    }, [setScrollPosition]);
    /* Keep scroll position when new chunk of messages are being loaded */
    (0, react_1.useEffect)(() => {
        if (scrollbarRef.current && scrollPosition === 0) {
            scrollbarRef.current.scrollTop = scrollbarRef.current.scrollHeight - scrollHeight;
        }
    }, [messages.count]);
    /* Lazy loading messages - top (load) */
    (0, react_1.useEffect)(() => {
        if (scrollbarRef.current.scrollHeight < scrollbarRef.current.clientHeight)
            return;
        if (scrollbarRef.current && scrollPosition === 0) {
            // Cache scroll height before loading new messages (to keep the scroll position after re-rendering)
            setScrollHeight(scrollbarRef.current.scrollHeight);
            // Load next chunk of messages
            const trim = Math.max(0, messagesSlice - chunkSize);
            setMessagesSlice(trim);
            setChannelLoadingSlice(trim);
        }
    }, [setChannelLoadingSlice, scrollPosition]);
    /* Lazy loading messages - bottom (trim) */
    (0, react_1.useEffect)(() => {
        if (scrollbarRef.current.scrollHeight < scrollbarRef.current.clientHeight)
            return;
        if (scrollbarRef.current && scrollPosition === 1) {
            const totalMessagesAmount = messages.count + messagesSlice;
            const bottomMessagesSlice = Math.max(0, totalMessagesAmount - chunkSize);
            setMessagesSlice(bottomMessagesSlice);
            setChannelLoadingSlice(bottomMessagesSlice);
        }
    }, [setChannelLoadingSlice, scrollPosition, messages.count]);
    /* Scroll to the bottom on entering the channel or resizing window */
    (0, react_1.useEffect)(() => {
        if (scrollbarRef.current && scrollPosition === 1) {
            setTimeout(() => {
                scrollBottom();
            });
        }
        const eventListener = () => {
            scrollBottom();
        };
        window.addEventListener('resize', eventListener);
        return () => window.removeEventListener('resize', eventListener);
    }, [channel, messages, scrollbarRef]);
    return (react_1.default.createElement("div", { className: classes.scroll, ref: scrollbarRef, onScroll: onScroll },
        react_1.default.createElement(List_1.default, { disablePadding: true, className: classes.list, ref: messagesRef, id: 'messages-scroll' }, Object.keys(messages.groups).map(day => {
            return (react_1.default.createElement("div", { key: day },
                react_1.default.createElement(MessagesDivider_1.default, { title: day }),
                messages.groups[day].map(items => {
                    // Messages merged by sender (DisplayableMessage[])
                    const data = items[0];
                    return react_1.default.createElement(BasicMessage_1.default, { key: data.id, messages: items });
                })));
        }))));
};
exports.ChannelMessagesComponent = ChannelMessagesComponent;
exports.default = exports.ChannelMessagesComponent;
