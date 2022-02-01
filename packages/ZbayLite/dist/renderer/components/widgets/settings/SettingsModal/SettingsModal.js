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
exports.SettingsModal = void 0;
const react_1 = __importStar(require("react"));
const Tabs_1 = __importDefault(require("@material-ui/core/Tabs"));
const AppBar_1 = __importDefault(require("@material-ui/core/AppBar"));
const styles_1 = require("@material-ui/core/styles");
const core_1 = require("@material-ui/core");
const react_virtualized_1 = require("react-virtualized");
const rc_scrollbars_1 = require("rc-scrollbars");
const Modal_1 = __importDefault(require("../../../ui/Modal/Modal"));
const Tab_1 = __importDefault(require("../../../ui/Tab/Tab"));
const AccountSettingsForm_1 = __importDefault(require("../../../../containers/widgets/settings/AccountSettingsForm"));
const Notifications_1 = __importDefault(require("../../../../containers/widgets/settings/Notifications"));
const InviteToCommunity_1 = __importDefault(require("../../../../containers/widgets/settings/InviteToCommunity"));
const tabs = {
    account: AccountSettingsForm_1.default,
    notifications: Notifications_1.default,
    invite: InviteToCommunity_1.default
};
const useStyles = (0, styles_1.makeStyles)(theme => ({
    root: {
        zIndex: 1000,
        paddingLeft: 20,
        paddingTop: 32,
        paddingRight: 32
    },
    tabs: {
        color: theme.palette.colors.trueBlack
    },
    indicator: {
        height: '0 !important'
    },
    appbar: {
        backgroundColor: '#fff',
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.0)'
    },
    tabsDiv: {
        width: 168
    },
    selected: {
        backgroundColor: theme.palette.colors.lushSky,
        borderRadius: 5,
        color: `${theme.palette.colors.white} !important`
    },
    tab: {
        minHeight: 32,
        color: theme.palette.colors.trueBlack,
        opacity: 1,
        fontStyle: 'normal',
        fontWeight: 'normal'
    },
    content: {
        marginLeft: 32
    }
}));
const SettingsModal = ({ user, owner, open, handleClose }) => {
    const classes = useStyles({});
    const [contentRef, setContentRef] = react_1.default.useState(null);
    const scrollbarRef = react_1.default.useRef();
    const [offset, setOffset] = react_1.default.useState(0);
    const [currentTab, setCurrentTab] = (0, react_1.useState)('notifications');
    const adjustOffset = () => {
        if (contentRef.clientWidth > 800) {
            setOffset((contentRef.clientWidth - 800) / 2);
        }
    };
    const handleChange = (tab) => {
        setCurrentTab(tab);
    };
    react_1.default.useEffect(() => {
        if (contentRef) {
            window.addEventListener('resize', adjustOffset);
            adjustOffset();
        }
    }, [contentRef]);
    const TabComponent = tabs[currentTab];
    return (react_1.default.createElement(Modal_1.default, { open: open, handleClose: handleClose, title: user, isBold: true, addBorder: true, contentWidth: '100%' },
        react_1.default.createElement(core_1.Grid, { ref: ref => {
                if (ref) {
                    setContentRef(ref);
                }
            }, container: true, direction: 'row', className: classes.root },
            react_1.default.createElement(core_1.Grid, { item: true, className: classes.tabsDiv, style: { marginLeft: offset } },
                react_1.default.createElement(AppBar_1.default, { position: 'static', className: classes.appbar },
                    react_1.default.createElement(Tabs_1.default, { value: currentTab, onChange: (event, value) => {
                            event.persist();
                            handleChange(value);
                        }, orientation: 'vertical', className: classes.tabs, textColor: 'inherit', classes: { indicator: classes.indicator } },
                        react_1.default.createElement(Tab_1.default, { value: 'notifications', label: 'Notifications', classes: { selected: classes.selected } }),
                        owner && (react_1.default.createElement(Tab_1.default, { value: 'invite', label: 'Add members', classes: { selected: classes.selected } }))))),
            react_1.default.createElement(core_1.Grid, { item: true, xs: true },
                react_1.default.createElement(react_virtualized_1.AutoSizer, null, ({ width, height }) => {
                    const maxWidth = width > 632 ? 632 : width;
                    return (react_1.default.createElement(rc_scrollbars_1.Scrollbars, { ref: scrollbarRef, autoHideTimeout: 500, style: { width: maxWidth + offset, height: height } },
                        react_1.default.createElement(core_1.Grid, { item: true, className: classes.content, style: { paddingRight: offset } },
                            react_1.default.createElement(TabComponent, { setCurrentTab: setCurrentTab, scrollbarRef: scrollbarRef }))));
                })))));
};
exports.SettingsModal = SettingsModal;
exports.default = exports.SettingsModal;
