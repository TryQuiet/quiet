"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tab = void 0;
const react_1 = __importDefault(require("react"));
const classnames_1 = __importDefault(require("classnames"));
const Tab_1 = __importDefault(require("@material-ui/core/Tab"));
const styles_1 = require("@material-ui/core/styles");
const useStyles = (0, styles_1.makeStyles)(theme => ({
    tabRoot: {
        textTransform: 'initial',
        color: theme.typography.subtitle1.color
    },
    textColorPrimary: {
        '&$selected': {
            color: theme.palette.colors.purple
        },
        '&$disabled': {
            color: theme.palette.colors.darkGrey
        }
    },
    selected: {
        color: theme.palette.colors.purple
    }
}));
const Tab = props => {
    const classes = useStyles({});
    return (react_1.default.createElement(Tab_1.default, Object.assign({ classes: {
            root: (0, classnames_1.default)({
                [classes.tabRoot]: true
            }),
            textColorPrimary: classes.textColorPrimary,
            selected: classes.selected
        } }, props)));
};
exports.Tab = Tab;
exports.default = exports.Tab;
