"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateChannelModal = void 0;
const react_1 = __importDefault(require("react"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const styles_1 = require("@material-ui/core/styles");
const Modal_1 = __importDefault(require("../../ui/Modal/Modal"));
const CreateChannelForm_1 = __importDefault(require("../../../containers/widgets/channels/CreateChannelForm"));
const useStyles = (0, styles_1.makeStyles)(() => ({
    root: {
        padding: 32,
        height: '100%',
        width: '100%'
    }
}));
const CreateChannelModal = ({ open, handleClose }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(Modal_1.default, { open: open, handleClose: handleClose, title: '', fullPage: true },
        react_1.default.createElement(Grid_1.default, { className: classes.root },
            react_1.default.createElement(CreateChannelForm_1.default, null))));
};
exports.CreateChannelModal = CreateChannelModal;
exports.default = exports.CreateChannelModal;
