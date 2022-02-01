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
exports.ChannelInputComponent = void 0;
const react_1 = __importStar(require("react"));
const classnames_1 = __importDefault(require("classnames"));
const react_contenteditable_1 = __importDefault(require("react-contenteditable"));
const emoji_picker_react_1 = __importDefault(require("emoji-picker-react"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const styles_1 = require("@material-ui/core/styles");
const orange_1 = __importDefault(require("@material-ui/core/colors/orange"));
const ClickAwayListener_1 = __importDefault(require("@material-ui/core/ClickAwayListener"));
const ChannelInputInfoMessage_1 = __importDefault(require("./ChannelInputInfoMessage"));
const InputState_enum_1 = require("./InputState.enum");
const Icon_1 = __importDefault(require("../../../ui/Icon/Icon"));
const emojiGray_svg_1 = __importDefault(require("../../../../static/images/emojiGray.svg"));
const emojiBlack_svg_1 = __importDefault(require("../../../../static/images/emojiBlack.svg"));
const useStyles = (0, styles_1.makeStyles)(theme => ({
    root: {
        background: '#fff',
        height: '100%',
        width: '100%'
    },
    '@keyframes blinker': {
        from: { opacity: 0 },
        to: { opacity: 1 }
    },
    input: {
        fontSize: 14,
        outline: 'none',
        padding: '12px 16px',
        lineHeight: '24px',
        '&:empty': {
            '&:before': {
                content: 'attr(placeholder)',
                display: 'block',
                color: '#aaa'
            }
        },
        wordBreak: 'break-word'
    },
    textfield: {
        border: `1px solid ${theme.palette.colors.veryLightGray}`,
        maxHeight: 300,
        'overflow-y': 'auto',
        borderRadius: 4,
        '&:hover': {
            borderColor: theme.palette.colors.trueBlack
        }
    },
    inputsDiv: {
        paddingLeft: '20px',
        paddingRight: '20px',
        width: '100%',
        margin: '0px'
    },
    disabledBottomMargin: {
        marginBottom: 0
    },
    warningIcon: {
        color: orange_1.default[500]
    },
    blinkAnimation: {
        animationName: '$blinker',
        animationDuration: '1s',
        animationTimingFunction: 'linear',
        animationIterationCount: 1
    },
    backdrop: {
        height: 'auto',
        padding: `${theme.spacing(1)}px`,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        WebkitTapHighlightColor: 'transparent',
        pointerEvents: 'none',
        touchAction: 'none'
    },
    focused: {
        borderColor: theme.palette.colors.trueBlack
    },
    iconButton: {
        marginRight: 0
    },
    highlight: {
        color: theme.palette.colors.lushSky,
        backgroundColor: theme.palette.colors.lushSky12,
        padding: 5,
        borderRadius: 4
    },
    emoji: {
        marginRight: 17,
        marginLeft: 10,
        cursor: 'pointer'
    },
    actions: {
        postion: 'relative'
    },
    picker: {
        position: 'absolute',
        bottom: 60,
        right: 15
    },
    errorIcon: {
        display: 'flex',
        justify: 'center',
        alignItems: 'center',
        marginLeft: 20,
        marginRight: 5
    },
    errorText: {
        color: theme.palette.colors.trueBlack
    },
    errorBox: {
        marginTop: 5
    },
    linkBlue: {
        fontWeight: 'normal',
        fontStyle: 'normal',
        cursor: 'pointer',
        color: theme.palette.colors.linkBlue
    },
    notAllowed: {
        cursor: 'not-allowed'
    }
}));
const ChannelInputComponent = ({ channelAddress, channelParticipants = [], inputPlaceholder, inputState = InputState_enum_1.INPUT_STATE.AVAILABLE, initialMessage = '', onChange, onKeyPress, infoClass, setInfoClass }) => {
    const classes = useStyles({});
    const [_anchorEl, setAnchorEl] = react_1.default.useState(null);
    const [mentionsToSelect, setMentionsToSelect] = react_1.default.useState([]);
    const messageRef = react_1.default.useRef();
    const refSelected = react_1.default.useRef();
    const isFirstRenderRef = react_1.default.useRef(true);
    const mentionsToSelectRef = react_1.default.useRef();
    const inputRef = react_1.default.createRef(); // any for updater.enqueueForceUpdate
    const [focused, setFocused] = react_1.default.useState(false);
    const [selected, setSelected] = react_1.default.useState(0);
    const [emojiHovered, setEmojiHovered] = react_1.default.useState(false);
    const [openEmoji, setOpenEmoji] = react_1.default.useState(false);
    const [htmlMessage, setHtmlMessage] = react_1.default.useState(initialMessage);
    const [message, setMessage] = react_1.default.useState(initialMessage);
    window.onfocus = () => {
        var _a;
        (_a = inputRef === null || inputRef === void 0 ? void 0 : inputRef.current) === null || _a === void 0 ? void 0 : _a.el.current.focus();
        setFocused(true);
    };
    const scrollToBottom = () => {
        var _a;
        const scroll = (_a = document.getElementById('messages-scroll')) === null || _a === void 0 ? void 0 : _a.parentElement;
        setTimeout(() => {
            if (scroll === null || scroll === void 0 ? void 0 : scroll.scrollTop) {
                scroll.scrollTop = scroll.scrollHeight;
            }
        }, 100);
    };
    react_1.default.useEffect(() => {
        inputRef.current.updater.enqueueForceUpdate(inputRef.current);
    }, [inputPlaceholder, channelAddress]);
    // Use reference to bypass memorization
    react_1.default.useEffect(() => {
        refSelected.current = selected;
    }, [selected]);
    const isRefSelected = (refSelected) => {
        return typeof refSelected === 'number';
    };
    react_1.default.useEffect(() => {
        mentionsToSelectRef.current = mentionsToSelect;
    }, [mentionsToSelect]);
    react_1.default.useEffect(() => {
        if (!message) {
            setHtmlMessage('');
        }
    }, [message]);
    react_1.default.useEffect(() => {
        setMessage(initialMessage);
        setHtmlMessage(initialMessage);
        if (!isFirstRenderRef.current) {
            return () => {
                if (messageRef === null || messageRef === void 0 ? void 0 : messageRef.current) {
                    onChange(messageRef.current);
                }
            };
        }
        isFirstRenderRef.current = false;
    }, [channelAddress]);
    react_1.default.useEffect(() => {
        messageRef.current = message;
    }, [message]);
    const findMentions = react_1.default.useCallback((text) => {
        // Search for any mention in message string
        const result = text.replace(/(<span([^>]*)>)?@([a-z0-9]?\w*)(<\/span>)?/gi, (match, span, _class, nickname) => {
            // Ignore already established mentions
            if (span === null || span === void 0 ? void 0 : span.includes('class')) {
                return match;
            }
            nickname = nickname !== null && nickname !== void 0 ? nickname : '';
            const possibleMentions = channelParticipants.filter(user => user.nickname.startsWith(nickname) &&
                !channelParticipants.find(user => user.nickname === nickname));
            if (JSON.stringify(mentionsToSelect) !== JSON.stringify(possibleMentions)) {
                setMentionsToSelect(possibleMentions);
                setTimeout(() => {
                    setSelected(0);
                }, 0);
            }
            // Wrap mention in spans to be able to treat it as an anchor for popper
            return `<span>@${nickname}</span>`;
        });
        return result;
    }, [mentionsToSelect, setMentionsToSelect]);
    const sanitizedHtml = findMentions(htmlMessage);
    const onChangeCb = (0, react_1.useCallback)((e) => {
        if (inputState === InputState_enum_1.INPUT_STATE.AVAILABLE) {
            // @ts-expect-error
            setMessage(e.nativeEvent.target.innerText);
            // @ts-expect-error
            if (!e.nativeEvent.target.innerText) {
                setHtmlMessage('');
            }
            else {
                setHtmlMessage(e.target.value);
            }
        }
        setAnchorEl(e.currentTarget.lastElementChild);
    }, [setAnchorEl, onChange, setHtmlMessage]);
    const inputStateRef = react_1.default.useRef(inputState);
    react_1.default.useEffect(() => {
        inputStateRef.current = inputState;
    });
    const mentionSelectAction = (e) => {
        var _a;
        e.preventDefault();
        const nickname = mentionsToSelectRef.current[refSelected.current].nickname;
        setHtmlMessage(htmlMessage => {
            const wrapped = `<span class="${classes.highlight}">@${nickname}</span>&nbsp;`;
            return htmlMessage.replace(/<span>[^/]*<\/span>$/g, wrapped);
        });
        // Replace mentions characters with full nickname in original message string
        setMessage(message.replace(/(\b(\w+)$)/, `${nickname} `));
        // Clear popper items after choosing mention
        setMentionsToSelect([]);
        (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.el.current.focus();
    };
    const onKeyDownCb = (0, react_1.useCallback)(e => {
        if (!isRefSelected(refSelected.current)) {
            throw new Error('refSelected is on unexpected type');
        }
        if (!(mentionsToSelectRef === null || mentionsToSelectRef === void 0 ? void 0 : mentionsToSelectRef.current)) {
            return;
        }
        if (mentionsToSelectRef.current.length) {
            if (e.nativeEvent.keyCode === 40) {
                if (refSelected.current + 1 >= mentionsToSelectRef.current.length) {
                    setSelected(0);
                }
                else {
                    setSelected(refSelected.current + 1);
                }
                e.preventDefault();
            }
            if (e.nativeEvent.keyCode === 38) {
                if (refSelected.current - 1 < 0) {
                    setSelected(mentionsToSelectRef.current.length - 1);
                }
                else {
                    setSelected(refSelected.current - 1);
                }
                e.preventDefault();
            }
            if (e.nativeEvent.keyCode === 13 || e.nativeEvent.keyCode === 9) {
                mentionSelectAction(e);
            }
        }
        if (inputStateRef.current === InputState_enum_1.INPUT_STATE.AVAILABLE &&
            e.nativeEvent.keyCode === 13 &&
            e.target.innerText !== '') {
            e.preventDefault();
            onChange(e.target.innerText);
            onKeyPress(e.target.innerText);
            setMessage('');
            setHtmlMessage('');
            scrollToBottom();
        }
        else {
            if (e.nativeEvent.keyCode === 13) {
                e.preventDefault();
                if (infoClass !== (0, classnames_1.default)(classes.backdrop, classes.blinkAnimation)) {
                    setInfoClass((0, classnames_1.default)(classes.backdrop, classes.blinkAnimation));
                    setTimeout(() => setInfoClass((0, classnames_1.default)(classes.backdrop)), 1000);
                }
            }
        }
    }, [
        inputState,
        message,
        mentionsToSelectRef,
        onChange,
        onKeyPress,
        setMessage,
        setHtmlMessage,
        scrollToBottom,
        infoClass,
        setInfoClass,
        setSelected
    ]);
    return (react_1.default.createElement(Grid_1.default, { className: (0, classnames_1.default)({
            [classes.root]: true,
            [classes.notAllowed]: inputState !== InputState_enum_1.INPUT_STATE.AVAILABLE
        }) },
        react_1.default.createElement(Grid_1.default, { container: true, className: (0, classnames_1.default)({
                [classes.root]: true
            }), direction: 'column', justify: 'center' },
            react_1.default.createElement(Grid_1.default, { container: true, direction: 'row', alignItems: 'center', justify: 'center', spacing: 0, className: (0, classnames_1.default)({
                    [classes.inputsDiv]: true
                }) },
                react_1.default.createElement(ClickAwayListener_1.default, { onClickAway: () => {
                        setFocused(false);
                    } },
                    react_1.default.createElement(Grid_1.default, { item: true, xs: true, container: true, className: (0, classnames_1.default)({
                            [classes.textfield]: true,
                            [classes.focused]: focused
                        }), justify: 'center', alignItems: 'center' },
                        react_1.default.createElement(Grid_1.default, { item: true, xs: true },
                            react_1.default.createElement(react_contenteditable_1.default, { ref: inputRef, placeholder: `Message ${inputPlaceholder}`, className: classes.input, onClick: () => {
                                    if (!focused) {
                                        setFocused(true);
                                    }
                                }, html: sanitizedHtml, onChange: onChangeCb, onKeyDown: onKeyDownCb, onPaste: (e) => {
                                    e.preventDefault();
                                    var text = e.clipboardData.getData('text/plain');
                                    document.execCommand('insertHTML', false, text);
                                } })),
                        react_1.default.createElement(Grid_1.default, { item: true, className: classes.actions },
                            react_1.default.createElement(Grid_1.default, { container: true, justify: 'center', alignItems: 'center' },
                                react_1.default.createElement(Icon_1.default, { className: classes.emoji, src: emojiHovered ? emojiBlack_svg_1.default : emojiGray_svg_1.default, onClickHandler: () => {
                                        setOpenEmoji(true);
                                    }, onMouseEnterHandler: () => {
                                        setEmojiHovered(true);
                                    }, onMouseLeaveHandler: () => {
                                        setEmojiHovered(false);
                                    } })),
                            openEmoji && (react_1.default.createElement(ClickAwayListener_1.default, { onClickAway: () => {
                                    setOpenEmoji(false);
                                } },
                                react_1.default.createElement("div", { className: classes.picker },
                                    react_1.default.createElement(emoji_picker_react_1.default
                                    /* eslint-disable */
                                    , { 
                                        /* eslint-disable */
                                        onEmojiClick: (_e, emoji) => {
                                            setHtmlMessage(htmlMessage => htmlMessage + emoji.emoji);
                                            setMessage(message + emoji.emoji);
                                            setOpenEmoji(false);
                                        } })))))))),
            react_1.default.createElement(ChannelInputInfoMessage_1.default, { showInfoMessage: inputState !== InputState_enum_1.INPUT_STATE.AVAILABLE, inputState: inputState }))));
};
exports.ChannelInputComponent = ChannelInputComponent;
exports.default = exports.ChannelInputComponent;
