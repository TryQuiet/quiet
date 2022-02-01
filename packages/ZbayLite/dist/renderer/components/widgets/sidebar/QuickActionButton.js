"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickActionButton = void 0;
const react_1 = __importDefault(require("react"));
const Button_1 = __importDefault(require("@material-ui/core/Button"));
const styles_1 = require("@material-ui/core/styles");
const core_1 = require("@material-ui/core");
const Add_1 = __importDefault(require("@material-ui/icons/Add"));
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    button: {
        marginTop: 8,
        padding: 0,
        marginLeft: 16,
        textTransform: 'none',
        '&:hover': {
            backgroundColor: 'inherit',
            opacity: 1
        },
        opacity: 0.7,
        color: theme.palette.colors.white
    },
    icon: {
        fontSize: 12,
        marginRight: 2,
        marginLeft: -2,
        marginBottom: 2
    },
    iconDiv: {
        marginRight: 5,
        marginBottom: 2
    }
}));
const QuickActionButton = ({ text, action, icon }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(Button_1.default, { variant: 'text', className: classes.button, onClick: action },
        icon ? (react_1.default.createElement("div", { className: classes.iconDiv }, icon)) : (react_1.default.createElement(Add_1.default, { className: classes.icon })),
        react_1.default.createElement(core_1.Typography, { variant: 'body2' }, text)));
};
exports.QuickActionButton = QuickActionButton;
exports.default = exports.QuickActionButton;
