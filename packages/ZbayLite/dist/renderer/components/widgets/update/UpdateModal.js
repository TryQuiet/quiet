"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateModal = void 0;
const react_1 = __importDefault(require("react"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const Button_1 = __importDefault(require("@material-ui/core/Button"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const styles_1 = require("@material-ui/core/styles");
const Icon_1 = __importDefault(require("../../ui/Icon/Icon"));
const updateIcon_svg_1 = __importDefault(require("../../../static/images/updateIcon.svg"));
const Modal_1 = __importDefault(require("../../ui/Modal/Modal"));
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    root: {
        backgroundColor: theme.palette.colors.white,
        border: 'none'
    },
    info: {
        marginTop: 38
    },
    button: {
        height: 55,
        fontSize: '0.9rem',
        backgroundColor: theme.palette.colors.zbayBlue
    },
    updateIcon: {
        width: 102,
        height: 102
    },
    title: {
        marginTop: 24,
        marginBottom: 16
    },
    subTitle: {
        marginBottom: 32
    }
}));
const UpdateModal = ({ open, handleClose, handleUpdate }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(Modal_1.default, { open: open, handleClose: handleClose },
        react_1.default.createElement(Grid_1.default, { container: true, direction: 'column', className: classes.root, alignItems: 'center', justify: 'flex-start' },
            react_1.default.createElement(Grid_1.default, { className: classes.info, container: true, justify: 'center' },
                react_1.default.createElement(Grid_1.default, { item: true },
                    react_1.default.createElement(Icon_1.default, { src: updateIcon_svg_1.default }))),
            react_1.default.createElement(Grid_1.default, { container: true, item: true, justify: 'center' },
                react_1.default.createElement(Grid_1.default, { item: true, className: classes.title },
                    react_1.default.createElement(Typography_1.default, { variant: 'h3' }, "Softare update"))),
            react_1.default.createElement(Grid_1.default, { container: true, item: true, justify: 'center' },
                react_1.default.createElement(Grid_1.default, { item: true, className: classes.subTitle },
                    react_1.default.createElement(Typography_1.default, { variant: 'body2' }, "An update is available for Zbay."))),
            react_1.default.createElement(Grid_1.default, { container: true, spacing: 8, justify: 'center' },
                react_1.default.createElement(Grid_1.default, { item: true, xs: 4 },
                    react_1.default.createElement(Button_1.default, { variant: 'contained', size: 'large', color: 'primary', type: 'submit', onClick: handleUpdate, fullWidth: true, className: classes.button }, "Update now"))))));
};
exports.UpdateModal = UpdateModal;
exports.default = exports.UpdateModal;
