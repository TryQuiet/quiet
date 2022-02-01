"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modal = void 0;
const react_1 = __importDefault(require("react"));
const classnames_1 = __importDefault(require("classnames"));
const Modal_1 = __importDefault(require("@material-ui/core/Modal"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const styles_1 = require("@material-ui/core/styles");
const Clear_1 = __importDefault(require("@material-ui/icons/Clear"));
const ArrowBack_1 = __importDefault(require("@material-ui/icons/ArrowBack"));
const IconButton_1 = __importDefault(require("../Icon/IconButton"));
const constants = {
    headerHeight: 60
};
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    root: {
        padding: '0 15%'
    },
    title: {
        fontSize: 15,
        color: theme.palette.colors.trueBlack,
        lineHeight: '18px',
        fontStyle: 'normal',
        fontWeight: 'normal'
    },
    header: {
        background: theme.palette.colors.white,
        height: constants.headerHeight
    },
    headerBorder: {
        borderBottom: `1px solid ${theme.palette.colors.contentGray}`
    },
    actions: {
        paddingLeft: 10,
        paddingRight: 10
    },
    content: {
        background: theme.palette.colors.white
    },
    fullPage: {
        width: '100%',
        height: `calc(100vh - ${constants.headerHeight}px)`
    },
    centered: {
        background: theme.palette.colors.white,
        width: '100vw',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        outline: 0
    },
    window: {},
    bold: {
        fontSize: 16,
        lineHeight: '26px',
        fontWeight: 500
    }
}));
const Modal = ({ open, handleClose, title, canGoBack, isBold, step, setStep, contentWidth, isCloseDisabled, alignCloseLeft, addBorder, children, testIdPrefix = '' }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(Modal_1.default, { open: open, onClose: handleClose, className: classes.root },
        react_1.default.createElement(Grid_1.default, { container: true, direction: "column", justify: "center", className: (0, classnames_1.default)({
                [classes.centered]: true,
                [classes.window]: true
            }) },
            react_1.default.createElement(Grid_1.default, { container: true, item: true, className: (0, classnames_1.default)({
                    [classes.header]: true,
                    [classes.headerBorder]: addBorder
                }), direction: "row", alignItems: "center" },
                react_1.default.createElement(Grid_1.default, { item: true, xs: true, container: true, direction: alignCloseLeft ? 'row-reverse' : 'row', justify: "center", alignItems: "center" },
                    react_1.default.createElement(Grid_1.default, { item: true, xs: true },
                        react_1.default.createElement(Typography_1.default, { variant: "subtitle1", className: (0, classnames_1.default)({
                                [classes.title]: true,
                                [classes.bold]: isBold
                            }), style: alignCloseLeft ? { marginRight: 36 } : { marginLeft: 36 }, align: "center" }, title)),
                    react_1.default.createElement(Grid_1.default, { item: true },
                        react_1.default.createElement(Grid_1.default, { container: true, item: true, justify: alignCloseLeft ? 'flex-start' : 'flex-end', className: classes.actions, "data-testid": `${testIdPrefix}ModalActions` }, canGoBack ? (react_1.default.createElement(IconButton_1.default, { onClick: () => {
                                if (setStep && step) {
                                    return setStep(step - 1);
                                }
                            } },
                            react_1.default.createElement(ArrowBack_1.default, null))) : (!isCloseDisabled && (react_1.default.createElement(IconButton_1.default, { onClick: () => {
                                if (handleClose) {
                                    return handleClose({}, 'backdropClick');
                                }
                            } },
                            react_1.default.createElement(Clear_1.default, null)))))))),
            react_1.default.createElement(Grid_1.default, { container: true, item: true, direction: 'row', justify: 'center', className: classes.fullPage },
                react_1.default.createElement(Grid_1.default, { container: true, item: true, className: (0, classnames_1.default)({ [classes.content]: true }), style: { width: contentWidth } }, children)))));
};
exports.Modal = Modal;
exports.Modal.defaultProps = {
    canGoBack: false,
    isBold: false,
    alignCloseLeft: false,
    contentWidth: 600,
    isCloseDisabled: false,
    addBorder: false
};
exports.default = exports.Modal;
