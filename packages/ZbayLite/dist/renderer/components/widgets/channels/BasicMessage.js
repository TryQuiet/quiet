"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicMessageComponent = exports.transformToLowercase = exports.getTimeFormat = void 0;
const react_1 = __importDefault(require("react"));
const styles_1 = require("@material-ui/core/styles");
const classnames_1 = __importDefault(require("classnames"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const ListItem_1 = __importDefault(require("@material-ui/core/ListItem"));
const ListItemText_1 = __importDefault(require("@material-ui/core/ListItemText"));
const red_1 = __importDefault(require("@material-ui/core/colors/red"));
const react_jdenticon_1 = __importDefault(require("react-jdenticon"));
const NestedMessageContent_1 = require("./NestedMessageContent");
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    messageCard: {
        padding: 0
    },
    wrapper: {
        backgroundColor: theme.palette.colors.white
    },
    clickable: {
        cursor: 'pointer'
    },
    wrapperPending: {
        background: theme.palette.colors.white
    },
    username: {
        fontSize: 16,
        fontWeight: 500,
        marginTop: -4,
        marginRight: 5
    },
    statusIcon: {
        color: theme.palette.colors.lightGray,
        fontSize: 21,
        marginLeft: theme.spacing(1)
    },
    broadcasted: {
        color: theme.palette.colors.lightGray
    },
    failed: {
        color: red_1.default[500]
    },
    avatar: {
        minHeight: 36,
        minWidth: 36,
        marginRight: 10,
        marginBottom: 4,
        borderRadius: 4,
        backgroundColor: theme.palette.colors.grayBackgroud
    },
    alignAvatar: {
        marginTop: 2,
        marginLeft: 2,
        width: 32,
        height: 32
    },
    moderation: {
        cursor: 'pointer',
        marginRight: 10
    },
    time: {
        color: theme.palette.colors.lightGray,
        fontSize: 14,
        marginTop: -4,
        marginRight: 5
    },
    iconBox: {
        marginTop: -4
    }
}));
const getTimeFormat = () => {
    return 't';
};
exports.getTimeFormat = getTimeFormat;
const transformToLowercase = (string) => {
    const hasPM = string.search('PM');
    return hasPM !== -1 ? string.replace('PM', 'pm') : string.replace('AM', 'am');
};
exports.transformToLowercase = transformToLowercase;
const BasicMessageComponent = ({ messages }) => {
    const classes = useStyles({});
    // const [anchorEl, setAnchorEl] = React.useState<HTMLDivElement | null>(null)
    // const handleClick: React.ComponentProps<typeof Grid>['onClick'] = event => {
    //   if (event) {
    //     setAnchorEl(event.currentTarget)
    //   }
    // }
    // const handleClose = () => setAnchorEl(null)
    const messageDisplayData = messages[0];
    return (react_1.default.createElement(ListItem_1.default, { className: (0, classnames_1.default)({
            [classes.wrapper]: true,
            [classes.clickable]: ['failed', 'cancelled'].includes(status),
            [classes.wrapperPending]: status !== 'broadcasted'
        }), 
        // onClick={() => setActionsOpen(!actionsOpen)}
        onMouseOver: () => { }, onMouseLeave: () => { } },
        react_1.default.createElement(ListItemText_1.default, { disableTypography: true, className: classes.messageCard, primary: react_1.default.createElement(Grid_1.default, { container: true, direction: 'row', justify: 'flex-start', alignItems: 'flex-start', wrap: 'nowrap' },
                react_1.default.createElement(Grid_1.default, { item: true, className: classes.avatar },
                    react_1.default.createElement("div", { className: classes.alignAvatar },
                        react_1.default.createElement(react_jdenticon_1.default, { size: '32', value: messageDisplayData.nickname }))),
                react_1.default.createElement(Grid_1.default, { container: true, item: true, direction: 'row' },
                    react_1.default.createElement(Grid_1.default, { container: true, item: true, direction: 'row', justify: 'space-between' },
                        react_1.default.createElement(Grid_1.default, { container: true, item: true, xs: true, alignItems: 'flex-start', wrap: 'nowrap' },
                            react_1.default.createElement(Grid_1.default, { item: true },
                                react_1.default.createElement(Typography_1.default, { color: 'textPrimary', className: classes.username }, messageDisplayData.nickname)),
                            status !== 'failed' && (react_1.default.createElement(Grid_1.default, { item: true },
                                react_1.default.createElement(Typography_1.default, { className: classes.time }, messageDisplayData.date))))),
                    react_1.default.createElement(Grid_1.default, { container: true, direction: 'column' }, messages.map((message, index) => {
                        return react_1.default.createElement(NestedMessageContent_1.NestedMessageContent, { message: message, index: index });
                    })))) })));
};
exports.BasicMessageComponent = BasicMessageComponent;
exports.default = exports.BasicMessageComponent;
