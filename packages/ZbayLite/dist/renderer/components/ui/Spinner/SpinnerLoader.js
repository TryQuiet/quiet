"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinnerLoader = void 0;
const react_1 = __importDefault(require("react"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const CircularProgress_1 = __importDefault(require("@material-ui/core/CircularProgress"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const styles_1 = require("@material-ui/core/styles");
const useStyles = (0, styles_1.makeStyles)(theme => ({
    message: {
        marginTop: theme.spacing(2),
        color: theme.palette.primary.main
    },
    spinner: props => ({
        color: props.color ? props.color : theme.palette.colors.white
    })
}));
const SpinnerLoader = ({ size = 40, message, color, className }) => {
    const stylesProps = { color: color };
    const classes = useStyles(stylesProps);
    return (react_1.default.createElement(Grid_1.default, { container: true, justify: 'center', alignItems: 'center', direction: 'column', className: className },
        react_1.default.createElement(CircularProgress_1.default, { color: 'inherit', className: classes.spinner, size: size }),
        react_1.default.createElement(Typography_1.default, { variant: 'caption', style: { fontSize: `${size / 44}rem` }, className: classes.message, align: 'center' }, message)));
};
exports.SpinnerLoader = SpinnerLoader;
exports.default = exports.SpinnerLoader;
