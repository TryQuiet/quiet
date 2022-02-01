"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const styles_1 = require("@material-ui/core/styles");
const rc_scrollbars_1 = require("rc-scrollbars");
const react_virtualized_1 = require("react-virtualized");
const IdentityPanel_1 = __importDefault(require("../../../containers/ui/IdentityPanel"));
const ChannelsPanel_1 = __importDefault(require("../../../containers/widgets/channels/ChannelsPanel"));
// import DirectMessagesPanel from '../../../containers/widgets/channels/DirectMessagesPanel'
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    root: {
        paddingTop: '30px',
        minHeight: '100%',
        width: '220px',
        position: 'relative',
        backgroundImage: 'linear-gradient(290.29deg, #521576 18.61%, #E42656 96.07%)',
        color: theme.palette.colors.white
    },
    padding: {
        padding: 0
    },
    content: {
        height: '100%'
    },
    gutterBottom: {
        marginBottom: theme.spacing(4)
    },
    walletInfo: {
        backgroundColor: 'rgb(0,0,0,0.1)'
    }
}));
const Sidebar = () => {
    const classes = useStyles({});
    return (react_1.default.createElement(Grid_1.default, { container: true, direction: 'column', className: classes.root },
        react_1.default.createElement(Grid_1.default, { item: true, xs: true, container: true, direction: 'column', className: classes.padding },
            react_1.default.createElement(Grid_1.default, { item: true },
                react_1.default.createElement(IdentityPanel_1.default, null)),
            react_1.default.createElement(Grid_1.default, { item: true, xs: true, container: true, direction: 'column' },
                react_1.default.createElement(react_virtualized_1.AutoSizer, null, ({ width, height }) => (react_1.default.createElement(rc_scrollbars_1.Scrollbars, { autoHideTimeout: 500, style: { width: width, height: height } },
                    react_1.default.createElement(ChannelsPanel_1.default, { title: 'Channels' }))))))));
};
exports.default = Sidebar;
