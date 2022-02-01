"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useErrorModalActions = exports.useErrorModalData = void 0;
const react_1 = __importDefault(require("react"));
const react_redux_1 = require("react-redux");
const electron_1 = require("electron");
const ErrorModal_1 = __importDefault(require("../../components/ui/ErrorModal/ErrorModal"));
const criticalError_1 = __importDefault(require("../../store/selectors/criticalError"));
const hooks_1 = require("../hooks");
const modals_types_1 = require("../../sagas/modals/modals.types");
const useErrorModalData = () => {
    const data = {
        message: (0, react_redux_1.useSelector)(criticalError_1.default.message),
        traceback: (0, react_redux_1.useSelector)(criticalError_1.default.traceback)
    };
    return data;
};
exports.useErrorModalData = useErrorModalData;
const useErrorModalActions = () => {
    const restartApp = () => {
        electron_1.remote.app.relaunch();
        electron_1.remote.app.quit();
    };
    return { restartApp };
};
exports.useErrorModalActions = useErrorModalActions;
const ErrorModalContainer = () => {
    const { message, traceback } = (0, exports.useErrorModalData)();
    const { restartApp } = (0, exports.useErrorModalActions)();
    const modal = (0, hooks_1.useModal)(modals_types_1.ModalName.quitApp);
    return (react_1.default.createElement(ErrorModal_1.default, { message: message, traceback: traceback, open: modal.open, handleExit: modal.handleClose, restartApp: restartApp }));
};
exports.default = ErrorModalContainer;
