"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuitAppDialog = void 0;
const react_1 = __importDefault(require("react"));
const Dialog_1 = __importDefault(require("@material-ui/core/Dialog"));
const DialogContent_1 = __importDefault(require("@material-ui/core/DialogContent"));
const DialogActions_1 = __importDefault(require("@material-ui/core/DialogActions"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const styles_1 = require("@material-ui/core/styles");
const useStyles = (0, styles_1.makeStyles)(theme => ({
    root: {},
    info: {
        fontWeight: 500
    },
    dialogContent: {
        borderBottom: `1px solid ${theme.palette.colors.veryLightGray}`
    },
    buttonNo: {
        borderRight: `1px solid ${theme.palette.colors.veryLightGray}`,
        cursor: 'pointer',
        padding: 10
    },
    buttonYes: {
        cursor: 'pointer',
        padding: 10,
        color: theme.palette.colors.lushSky
    },
    dialogActions: {
        padding: 0
    },
    typography: {
        textAlign: 'center'
    }
}));
const QuitAppDialog = ({ handleClose, handleQuit, open }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(Dialog_1.default, { onClose: handleClose, open: open },
        react_1.default.createElement(DialogContent_1.default, { className: classes.dialogContent },
            react_1.default.createElement(Typography_1.default, { className: classes.info, variant: 'body2' }, "Do you want to quit Zbay?")),
        react_1.default.createElement(DialogActions_1.default, { className: classes.dialogActions },
            react_1.default.createElement(Grid_1.default, { container: true, direction: 'row', justify: 'flex-end' },
                react_1.default.createElement(Grid_1.default, { item: true, xs: true, className: classes.buttonNo, onClick: handleClose },
                    react_1.default.createElement(Typography_1.default, { className: classes.typography, variant: 'body1' }, "No")),
                react_1.default.createElement(Grid_1.default, { item: true, xs: true, className: classes.buttonYes, onClick: handleQuit },
                    react_1.default.createElement(Typography_1.default, { className: classes.typography, variant: 'body1' }, "Yes"))))));
};
exports.QuitAppDialog = QuitAppDialog;
exports.default = exports.QuitAppDialog;
