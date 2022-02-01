"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorModal = void 0;
const react_1 = __importDefault(require("react"));
const isomorphic_fetch_1 = __importDefault(require("isomorphic-fetch"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const TextField_1 = __importDefault(require("@material-ui/core/TextField"));
const styles_1 = require("@material-ui/core/styles");
const red_1 = __importDefault(require("@material-ui/core/colors/red"));
const Icon_1 = __importDefault(require("../Icon/Icon"));
const Modal_1 = __importDefault(require("../Modal/Modal"));
const LoadingButton_1 = __importDefault(require("../LoadingButton/LoadingButton"));
const static_1 = require("../../../../shared/static");
const exclamationMark_svg_1 = __importDefault(require("../../../static/images/exclamationMark.svg"));
const useStyles = (0, styles_1.makeStyles)(theme => ({
    root: {
        padding: theme.spacing(4)
    },
    icon: {
        fontSize: '10rem',
        color: red_1.default[500],
        width: 80,
        height: 70
    },
    stackTrace: {
        fontSize: '14px',
        wordBreak: 'break-all'
    },
    message: {
        wordBreak: 'break-all',
        marginTop: 20,
        fontWeight: 500
    },
    info: {
        textAlign: 'center'
    },
    textfield: {},
    cssDisabled: {
        backgroundColor: theme.palette.colors.inputGray,
        color: theme.palette.colors.red
    },
    button: {
        textTransform: 'none',
        width: 150,
        height: 60
    }
}));
const handleSend = ({ title, message }) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, isomorphic_fetch_1.default)(static_1.LOG_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title,
            message
        })
    });
});
const ErrorModal = ({ open = false, message, traceback, handleExit, restartApp }) => {
    const classes = useStyles({});
    const [send, setSend] = react_1.default.useState(false);
    return (react_1.default.createElement(Modal_1.default, { open: open, handleClose: handleExit, title: 'Error' },
        react_1.default.createElement(Grid_1.default, { container: true, justify: 'flex-start', spacing: 3, direction: 'column', className: classes.root },
            react_1.default.createElement(Grid_1.default, { item: true, container: true, direction: 'column', alignItems: 'center' },
                react_1.default.createElement(Icon_1.default, { className: classes.icon, src: exclamationMark_svg_1.default }),
                react_1.default.createElement(Typography_1.default, { variant: 'h3', className: classes.message }, message)),
            react_1.default.createElement(Grid_1.default, { item: true, container: true, spacing: 2, direction: 'column' },
                react_1.default.createElement(Grid_1.default, { item: true },
                    react_1.default.createElement(Typography_1.default, { variant: 'body2', className: classes.info }, "You can send us this error traceback to help us improve. Before sending make sure it doesn't contain any private data.")),
                react_1.default.createElement(Grid_1.default, { item: true },
                    react_1.default.createElement(TextField_1.default, { id: 'traceback', disabled: true, variant: 'outlined', multiline: true, fullWidth: true, rows: 10, value: traceback, InputProps: {
                            classes: {
                                root: classes.textfield,
                                multiline: classes.stackTrace,
                                disabled: classes.cssDisabled
                            }
                        } })),
                react_1.default.createElement(Grid_1.default, { item: true, container: true, justify: 'center', alignItems: 'center' }, !send && (react_1.default.createElement(LoadingButton_1.default, { text: 'Send & restart', classes: { button: classes.button }, onClick: () => __awaiter(void 0, void 0, void 0, function* () {
                        try {
                            yield handleSend({ title: message, message: traceback });
                            setSend(true);
                            restartApp();
                        }
                        catch (err) {
                            console.log('ERROR SENDING MESSAGE', err.message);
                        }
                    }) })))))));
};
exports.ErrorModal = ErrorModal;
exports.default = exports.ErrorModal;
