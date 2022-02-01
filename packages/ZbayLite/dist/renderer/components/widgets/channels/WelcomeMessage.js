"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WelcomeMessage = void 0;
const react_1 = __importDefault(require("react"));
const classnames_1 = __importDefault(require("classnames"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const ListItem_1 = __importDefault(require("@material-ui/core/ListItem"));
const ListItemText_1 = __importDefault(require("@material-ui/core/ListItemText"));
const styles_1 = require("@material-ui/core/styles");
const zbay_square_logo_svg_1 = __importDefault(require("../../../static/images/zcash/zbay-square-logo.svg"));
const Icon_1 = __importDefault(require("../../ui/Icon/Icon"));
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    messageCard: {
        padding: 0
    },
    wrapper: {
        backgroundColor: theme.palette.colors.white
    },
    username: {
        fontSize: 16,
        fontWeight: 500,
        marginTop: -4,
        marginRight: 5
    },
    avatar: {
        marginRight: 10
    },
    message: {
        marginTop: 14,
        marginLeft: -4,
        whiteSpace: 'pre-line',
        wordBreak: 'break-word'
    },
    messageInput: {
        marginTop: -35,
        marginLeft: 50
    },
    icon: {
        width: 36,
        height: 36,
        borderRadius: 4
    },
    time: {
        color: theme.palette.colors.lightGray,
        fontSize: 14,
        marginTop: -4,
        marginRight: 5
    }
}));
const WelcomeMessage = ({ message, timestamp }) => {
    const classes = useStyles({});
    const username = 'Zbay';
    return (react_1.default.createElement(ListItem_1.default, { className: (0, classnames_1.default)({
            [classes.wrapper]: true
        }) },
        react_1.default.createElement(ListItemText_1.default, { disableTypography: true, className: classes.messageCard, primary: react_1.default.createElement(Grid_1.default, { container: true, direction: "row", justify: "flex-start", alignItems: "flex-start", wrap: 'nowrap' },
                react_1.default.createElement(Grid_1.default, { item: true, className: classes.avatar },
                    react_1.default.createElement(Icon_1.default, { className: classes.icon, src: zbay_square_logo_svg_1.default })),
                react_1.default.createElement(Grid_1.default, { container: true, item: true, direction: "row", justify: "space-between" },
                    react_1.default.createElement(Grid_1.default, { container: true, item: true, xs: true, alignItems: "flex-start", wrap: "nowrap" },
                        react_1.default.createElement(Grid_1.default, { item: true },
                            react_1.default.createElement(Typography_1.default, { color: "textPrimary", className: classes.username }, username)),
                        !!timestamp && (react_1.default.createElement(Grid_1.default, { item: true },
                            react_1.default.createElement(Typography_1.default, { className: classes.time }, timestamp)))))), secondary: react_1.default.createElement(Grid_1.default, { className: classes.messageInput, item: true },
                react_1.default.createElement(Typography_1.default, { variant: "body2", className: classes.message }, message)) })));
};
exports.WelcomeMessage = WelcomeMessage;
exports.WelcomeMessage.defaultProps = {
    timestamp: '0'
};
exports.default = exports.WelcomeMessage;
