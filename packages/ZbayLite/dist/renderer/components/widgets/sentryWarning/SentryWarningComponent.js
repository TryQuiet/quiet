"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SentryWarningComponent = void 0;
const react_1 = __importDefault(require("react"));
const core_1 = require("@material-ui/core");
const LoadingButton_1 = __importDefault(require("../../ui/LoadingButton/LoadingButton"));
const Modal_1 = __importDefault(require("../../ui/Modal/Modal"));
const useStyles = (0, core_1.makeStyles)(theme => ({
    main: {
        backgroundColor: theme.palette.colors.white,
        padding: '0px 32px'
    },
    title: {
        marginTop: 24
    },
    fullWidth: {
        paddingBottom: 25
    },
    button: {
        width: 139,
        height: 60,
        backgroundColor: theme.palette.colors.purple,
        padding: theme.spacing(2),
        '&:hover': {
            backgroundColor: theme.palette.colors.darkPurple
        },
        '&:disabled': {
            backgroundColor: theme.palette.colors.lightGray,
            color: 'rgba(255,255,255,0.6)'
        }
    }
}));
const SentryWarningComponent = ({ open, handleClose }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(Modal_1.default, { open: open, handleClose: handleClose, isCloseDisabled: true },
        react_1.default.createElement(core_1.Grid, { container: true, className: classes.main, direction: 'column' },
            react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement(core_1.Grid, { className: classes.title, item: true },
                    react_1.default.createElement(core_1.Grid, { item: true },
                        react_1.default.createElement(core_1.Typography, { variant: 'h4', color: 'error' }, "(!) Warning")),
                    react_1.default.createElement(core_1.Grid, { style: { marginTop: '8px' }, item: true },
                        react_1.default.createElement(core_1.Typography, { variant: 'h3' }, "App is running in debug mode"))),
                react_1.default.createElement(core_1.Grid, { item: true },
                    react_1.default.createElement(core_1.Typography, { variant: 'body2', color: 'textSecondary' }, "Some usage data may be send to centralized server for development purposes.")),
                react_1.default.createElement(core_1.Grid, { style: { marginTop: '24px' }, item: true },
                    react_1.default.createElement(LoadingButton_1.default, { variant: 'contained', color: 'primary', size: 'small', fullWidth: true, text: 'Understand', classes: { button: classes.button }, onClick: handleClose }))))));
};
exports.SentryWarningComponent = SentryWarningComponent;
