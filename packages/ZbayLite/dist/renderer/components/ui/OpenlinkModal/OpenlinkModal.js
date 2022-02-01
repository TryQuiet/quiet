"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenlinkModal = void 0;
const react_1 = __importDefault(require("react"));
const react_virtualized_1 = require("react-virtualized");
const rc_scrollbars_1 = require("rc-scrollbars");
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const styles_1 = require("@material-ui/core/styles");
const Checkbox_1 = __importDefault(require("@material-ui/core/Checkbox"));
const red_1 = __importDefault(require("@material-ui/core/colors/red"));
const Button_1 = __importDefault(require("@material-ui/core/Button"));
const electronStore_1 = __importDefault(require("../../../../shared/electronStore"));
const Icon_1 = __importDefault(require("../Icon/Icon"));
const exclamationMark_svg_1 = __importDefault(require("../../../static/images/exclamationMark.svg"));
const Modal_1 = __importDefault(require("../Modal/Modal"));
const useStyles = (0, styles_1.makeStyles)(theme => ({
    root: {
        padding: theme.spacing(4)
    },
    icon: {
        fontSize: '10rem',
        color: red_1.default[500],
        width: 80,
        height: 70
    },
    title: {
        marginTop: 36,
        marginBottom: 24
    },
    message: {
        wordBreak: 'break-word',
        marginTop: 16,
        fontWeight: 500
    },
    bold: {
        fontWeight: 600
    },
    checkboxLabel: {
        fontSize: 14,
        lineHeight: '24px',
        wordBreak: 'break-word'
    },
    checkboxes: {
        marginTop: 32
    },
    buttonBack: {
        width: 147,
        height: 60,
        backgroundColor: theme.palette.colors.zbayBlue,
        color: theme.palette.colors.white,
        '&:hover': {
            backgroundColor: theme.palette.colors.zbayBlue
        }
    },
    buttons: {
        marginTop: 24
    }
}));
const OpenlinkModal = ({ open, handleClose, handleConfirm, url = 'https://www.zbay.app/', addToWhitelist, setWhitelistAll, isImage = false }) => {
    const classes = useStyles({});
    const whitelist = electronStore_1.default.get('whitelist');
    const [allowThisLink, setAllowThisLink] = react_1.default.useState(false);
    const [allowAllLink, setAllowAllLink] = react_1.default.useState(false);
    const [dontAutoload, setDontAutoload] = react_1.default.useState(false);
    react_1.default.useEffect(() => {
        setAllowThisLink(whitelist ? whitelist.whitelisted.indexOf(url) !== -1 : false);
        setAllowAllLink(whitelist ? whitelist.allowAll : false);
    }, [url]);
    const uri = new URL(url);
    return (react_1.default.createElement(Modal_1.default, { open: open, handleClose: handleClose, title: '' },
        react_1.default.createElement(react_virtualized_1.AutoSizer, null, ({ width, height }) => (react_1.default.createElement(rc_scrollbars_1.Scrollbars, { autoHideTimeout: 500, style: { width: width, height: height } },
            react_1.default.createElement(Grid_1.default, { container: true, justify: 'flex-start', direction: 'column', className: classes.root },
                react_1.default.createElement(Grid_1.default, { item: true, container: true, direction: 'column', alignItems: 'center' },
                    react_1.default.createElement(Icon_1.default, { className: classes.icon, src: exclamationMark_svg_1.default }),
                    react_1.default.createElement(Typography_1.default, { variant: 'h2', className: classes.title }, "Watch out!")),
                react_1.default.createElement(Grid_1.default, { item: true, container: true, direction: 'column' },
                    react_1.default.createElement(Grid_1.default, { item: true },
                        react_1.default.createElement(Typography_1.default, { variant: 'body2' }, "Opening link posted in Zbay reveals data about you to your goverment, your Internet provider, the site you are visiting and, potentially, to whoever posted the link. Only open links from people you trust. If you are using Zbay to protect your anonymity, never open links."))),
                react_1.default.createElement(Grid_1.default, { item: true, container: true, spacing: 0, direction: 'column', className: classes.checkboxes },
                    ' ',
                    isImage ? (react_1.default.createElement(react_1.default.Fragment, null,
                        react_1.default.createElement(Grid_1.default, { item: true, container: true, justify: 'center', alignItems: 'center' },
                            react_1.default.createElement(Grid_1.default, { item: true },
                                react_1.default.createElement(Checkbox_1.default, { checked: allowThisLink, onChange: e => setAllowThisLink(e.target.checked), color: 'primary' })),
                            react_1.default.createElement(Grid_1.default, { item: true, xs: true, className: classes.checkboxLabel },
                                'Automatically load images from ',
                                react_1.default.createElement("span", { className: classes.bold }, uri.hostname),
                                "- I trust them with my data and I'm not using Zbay for anonymity protection. ")),
                        react_1.default.createElement(Grid_1.default, { item: true, container: true, justify: 'center', alignItems: 'center' },
                            react_1.default.createElement(Grid_1.default, { item: true },
                                react_1.default.createElement(Checkbox_1.default, { checked: dontAutoload, onChange: e => setDontAutoload(e.target.checked), color: 'primary' })),
                            react_1.default.createElement(Grid_1.default, { item: true, xs: true, className: classes.checkboxLabel },
                                "Don't warn me about ",
                                react_1.default.createElement("span", { className: classes.bold }, uri.hostname),
                                ' ',
                                "again, but don't auto-load images.")))) : (react_1.default.createElement(Grid_1.default, { item: true, container: true, justify: 'center', alignItems: 'center' },
                        react_1.default.createElement(Grid_1.default, { item: true },
                            react_1.default.createElement(Checkbox_1.default, { checked: allowThisLink, onChange: e => setAllowThisLink(e.target.checked), color: 'primary' })),
                        react_1.default.createElement(Grid_1.default, { item: true, xs: true, className: classes.checkboxLabel },
                            "Don't warn me about ",
                            react_1.default.createElement("span", { className: classes.bold }, uri.hostname),
                            " ",
                            'again'))),
                    react_1.default.createElement(Grid_1.default, { item: true, container: true, justify: 'center', alignItems: 'center' },
                        react_1.default.createElement(Grid_1.default, { item: true },
                            react_1.default.createElement(Checkbox_1.default, { checked: allowAllLink, onChange: e => setAllowAllLink(e.target.checked), color: 'primary' })),
                        react_1.default.createElement(Grid_1.default, { item: true, xs: true, className: classes.checkboxLabel }, 'Never warn me about outbound links on Zbay.')),
                    react_1.default.createElement(Grid_1.default, { item: true, container: true, spacing: 2, alignItems: 'center', className: classes.buttons },
                        react_1.default.createElement(Grid_1.default, { item: true },
                            react_1.default.createElement(Button_1.default, { className: classes.buttonBack, variant: 'contained', color: 'primary', size: 'large', onClick: () => {
                                    handleClose();
                                } }, "Back to safety")),
                        react_1.default.createElement(Grid_1.default, { item: true, xs: true },
                            react_1.default.createElement("a", { style: {
                                    color: '#67BFD3',
                                    textDecoration: 'none',
                                    wordBreak: 'break-all'
                                }, onClick: e => {
                                    e.preventDefault();
                                    handleConfirm();
                                    if (allowThisLink || dontAutoload) {
                                        addToWhitelist(url, dontAutoload);
                                    }
                                    setWhitelistAll(allowAllLink);
                                    handleClose();
                                }, href: '' }, isImage
                                ? `Load image from site ${uri.hostname}`
                                : `Continue to ${uri.hostname}`))))))))));
};
exports.OpenlinkModal = OpenlinkModal;
exports.default = exports.OpenlinkModal;
