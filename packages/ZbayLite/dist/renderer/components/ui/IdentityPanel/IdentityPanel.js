"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityPanel = void 0;
const react_1 = __importDefault(require("react"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const ExpandMore_1 = __importDefault(require("@material-ui/icons/ExpandMore"));
const core_1 = require("@material-ui/core");
const styles_1 = require("@material-ui/core/styles");
const useStyles = (0, styles_1.makeStyles)(theme => ({
    root: {
        marginTop: theme.spacing(1),
        WebkitAppRegion: process.platform === 'win32' ? 'no-drag' : 'drag',
        paddingLeft: 16,
        paddingRight: 16
    },
    button: {
        color: theme.palette.colors.white,
        padding: 0,
        textAlign: 'left',
        opacity: 0.8,
        '&:hover': {
            opacity: 1,
            backgroundColor: 'inherit'
        }
    },
    buttonLabel: {
        justifyContent: 'flex-start',
        textTransform: 'none'
    },
    nickname: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: 175,
        whiteSpace: 'nowrap'
    }
}));
const IdentityPanel = ({ handleSettings, community }) => {
    const classes = useStyles({});
    return (react_1.default.createElement("div", { className: classes.root },
        react_1.default.createElement(core_1.Button, { onClick: event => {
                event.persist();
                handleSettings();
            }, component: 'span', classes: { root: classes.button, label: classes.buttonLabel } },
            react_1.default.createElement(Typography_1.default, { variant: 'h4', className: classes.nickname }, (community === null || community === void 0 ? void 0 : community.name) || ''),
            react_1.default.createElement(ExpandMore_1.default, { fontSize: 'small' }))));
};
exports.IdentityPanel = IdentityPanel;
exports.default = exports.IdentityPanel;
