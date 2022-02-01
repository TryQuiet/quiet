"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const styles_1 = require("@material-ui/core/styles");
const SpinnerLoader_1 = __importDefault(require("../../ui/Spinner/SpinnerLoader"));
const Modal_1 = __importDefault(require("../../ui/Modal/Modal"));
const useStyles = (0, styles_1.makeStyles)(() => ({
    spinner: {
        top: '50%',
        position: 'relative',
        transform: 'translate(0, -50%)'
    }
}));
const LoadingPanelComponent = ({ open, handleClose, isClosedDisabled = true, message }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(Modal_1.default, { open: open, handleClose: handleClose, isCloseDisabled: isClosedDisabled },
        react_1.default.createElement(SpinnerLoader_1.default, { size: 40, message: message, color: 'black', className: classes.spinner })));
};
exports.default = LoadingPanelComponent;
