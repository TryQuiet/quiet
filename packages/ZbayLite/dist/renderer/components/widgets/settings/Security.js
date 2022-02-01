"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Security = void 0;
const react_1 = __importDefault(require("react"));
const electron_1 = require("electron");
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const styles_1 = require("@material-ui/core/styles");
const FormControlLabel_1 = __importDefault(require("@material-ui/core/FormControlLabel"));
const Checkbox_1 = __importDefault(require("@material-ui/core/Checkbox"));
const UserListItem_1 = __importDefault(require("../channelSettings/UserListItem"));
const LoadingButton_1 = __importDefault(require("../../ui/LoadingButton/LoadingButton"));
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    title: {},
    titleDiv: {
        marginBottom: 24
    },
    alignLabel: {
        marginTop: 3
    },
    labelDiv: {
        marginTop: 16,
        marginBottom: 24
    },
    itemName: {
        fontSize: 14
    },
    imageHostsDiv: {
        marginTop: 32
    },
    button: {
        marginTop: 24,
        textTransform: 'none',
        width: 480,
        height: 60,
        color: theme.palette.colors.white,
        backgroundColor: theme.palette.colors.zbayBlue,
        '&:hover': {
            opacity: 0.7,
            backgroundColor: theme.palette.colors.zbayBlue
        },
        marginBottom: 24
    },
    link: {
        textDecoration: 'none',
        color: theme.palette.colors.linkBlue
    }
}));
const Security = ({ allowAll, toggleAllowAll, openSeedModal, whitelisted, removeSiteHost }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(Grid_1.default, { container: true, direction: 'column' },
        react_1.default.createElement(Grid_1.default, { container: true, item: true, justify: 'space-between', alignItems: 'center', className: classes.titleDiv },
            react_1.default.createElement(Grid_1.default, { item: true, className: classes.title },
                react_1.default.createElement(Typography_1.default, { variant: 'h3' }, "Security"))),
        react_1.default.createElement(Grid_1.default, { item: true },
            react_1.default.createElement(Grid_1.default, { item: true },
                react_1.default.createElement(Typography_1.default, { variant: 'h5' }, "Your private recovery key")),
            react_1.default.createElement(Grid_1.default, { item: true },
                react_1.default.createElement(Typography_1.default, { variant: 'body2' }, "If something happens to your computer, you\u2019ll need this key to recover your account and your funds.")),
            react_1.default.createElement(Grid_1.default, { item: true },
                react_1.default.createElement(LoadingButton_1.default, { variant: 'contained', size: 'large', color: 'primary', type: 'submit', fullWidth: true, inProgress: false, onClick: () => {
                        openSeedModal();
                    }, text: 'View key', classes: { button: classes.button }, disabled: true }))),
        react_1.default.createElement(Grid_1.default, { item: true },
            react_1.default.createElement(Typography_1.default, { variant: 'h5' }, "P2P messaging over Tor")),
        react_1.default.createElement(Grid_1.default, { item: true },
            react_1.default.createElement(Typography_1.default, { variant: 'body2' },
                "For faster message delivery, Zbay can send and receive messages directly with Tor (instead of the Zcash blockchain) when other users are online.",
                ' ',
                react_1.default.createElement("a", { className: classes.link, onClick: e => {
                        e.preventDefault();
                        void electron_1.shell.openExternal('https://www.zbay.app/faq.html');
                    }, href: 'https://www.zbay.app/faq.html' }, "Learn more."))),
        react_1.default.createElement(Grid_1.default, { item: true },
            react_1.default.createElement(Typography_1.default, { variant: 'h5' }, "Verification")),
        react_1.default.createElement(Grid_1.default, { item: true },
            react_1.default.createElement(Typography_1.default, { variant: 'h5' }, "Outbound Links")),
        react_1.default.createElement(Grid_1.default, { item: true, className: classes.labelDiv },
            react_1.default.createElement(FormControlLabel_1.default, { control: react_1.default.createElement(Checkbox_1.default, { checked: allowAll, onChange: e => {
                        toggleAllowAll(e.target.checked);
                    }, color: 'default' }), label: react_1.default.createElement(Typography_1.default, { variant: 'body2', className: classes.alignLabel }, "Never warn me about outbound link on Zbay.") })),
        !!(whitelisted === null || whitelisted === void 0 ? void 0 : whitelisted.length) && (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(Grid_1.default, { item: true },
                react_1.default.createElement(Typography_1.default, { variant: 'h5' }, "Allowed sites")),
            react_1.default.createElement(Grid_1.default, { item: true },
                react_1.default.createElement(Typography_1.default, { variant: 'body2' }, "Links from these sites will not trigger warrning:")),
            whitelisted.map(hostname => {
                return (react_1.default.createElement(Grid_1.default, { item: true, key: hostname },
                    react_1.default.createElement(UserListItem_1.default, { name: hostname, actionName: 'Remove', prefix: '', action: () => {
                            removeSiteHost(hostname);
                        } })));
            })))));
};
exports.Security = Security;
exports.default = exports.Security;
