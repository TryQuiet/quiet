"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsernameCreated = void 0;
const react_1 = __importDefault(require("react"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const Button_1 = __importDefault(require("@material-ui/core/Button"));
const styles_1 = require("@material-ui/core/styles");
const Icon_1 = __importDefault(require("../../ui/Icon/Icon"));
const username_svg_1 = __importDefault(require("../../../static/images/username.svg"));
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    root: {},
    usernameConatainer: {
        marginTop: 24
    },
    infoConatainer: {
        marginTop: 24
    },
    descConatainer: {
        marginTop: 8
    },
    usernameIcon: {
        width: 118,
        height: 118,
        justifyContent: 'center'
    },
    buttonContainer: {
        marginTop: 23,
        paddingBottom: 63
    },
    button: {
        width: 124,
        height: 59,
        color: theme.palette.colors.white,
        backgroundColor: theme.palette.colors.purple,
        padding: theme.spacing(2),
        '&:hover': {
            backgroundColor: theme.palette.colors.darkPurple
        },
        '&:disabled': {
            backgroundColor: theme.palette.colors.gray
        }
    }
}));
const handleModalClose = (handleClose, setFormSent) => {
    setFormSent(false);
    handleClose();
};
const UsernameCreated = ({ handleClose, setFormSent }) => {
    const classes = useStyles({});
    setFormSent(false);
    return (react_1.default.createElement(Grid_1.default, { container: true, justify: 'center' },
        react_1.default.createElement(Grid_1.default, { container: true, className: classes.usernameConatainer, item: true, xs: 12, direction: 'row', justify: 'center' },
            react_1.default.createElement(Icon_1.default, { className: classes.usernameIcon, src: username_svg_1.default })),
        react_1.default.createElement(Grid_1.default, { container: true, item: true, className: classes.infoConatainer, xs: 12, direction: 'row', justify: 'center' },
            react_1.default.createElement(Typography_1.default, { variant: 'h4' }, "You created a username")),
        react_1.default.createElement(Grid_1.default, { item: true, xs: 'auto', className: classes.buttonContainer },
            react_1.default.createElement(Button_1.default, { variant: 'contained', onClick: () => handleModalClose(handleClose, setFormSent), size: 'small', fullWidth: true, className: classes.button }, "Done"))));
};
exports.UsernameCreated = UsernameCreated;
exports.default = exports.UsernameCreated;
