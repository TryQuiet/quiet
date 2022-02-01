"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InviteToCommunity = void 0;
const Button_1 = __importDefault(require("@material-ui/core/Button"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const styles_1 = require("@material-ui/core/styles");
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const react_1 = __importDefault(require("react"));
const react_copy_to_clipboard_1 = __importDefault(require("react-copy-to-clipboard"));
const useStyles = (0, styles_1.makeStyles)(theme => ({
    title: {},
    titleDiv: {
        marginBottom: 24
    },
    link: {
        textDecoration: 'none',
        color: theme.palette.colors.linkBlue
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
        }
    },
    bold: {
        fontWeight: 'bold'
    }
}));
const InviteToCommunity = ({ communityName, invitationUrl }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(Grid_1.default, { container: true, direction: 'column' },
        react_1.default.createElement(Grid_1.default, { container: true, item: true, justify: 'space-between', alignItems: 'center', className: classes.titleDiv },
            react_1.default.createElement(Grid_1.default, { item: true, className: classes.title },
                react_1.default.createElement(Typography_1.default, { variant: 'h3' }, "Add members"))),
        react_1.default.createElement(Grid_1.default, { item: true },
            react_1.default.createElement(Grid_1.default, { item: true },
                react_1.default.createElement(Typography_1.default, { variant: 'h5' }, "Your invitation url")),
            react_1.default.createElement(Grid_1.default, { item: true },
                react_1.default.createElement(Typography_1.default, { variant: 'body2' },
                    "Use this link to add members to ",
                    react_1.default.createElement("span", { className: classes.bold }, communityName)))),
        react_1.default.createElement(Grid_1.default, { item: true },
            react_1.default.createElement(Typography_1.default, { variant: 'body2' }, invitationUrl)),
        react_1.default.createElement(Grid_1.default, null,
            react_1.default.createElement(react_copy_to_clipboard_1.default, { text: invitationUrl },
                react_1.default.createElement(Button_1.default, { className: classes.button }, "Copy to clipboard")))));
};
exports.InviteToCommunity = InviteToCommunity;
