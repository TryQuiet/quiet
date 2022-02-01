"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const hooks_1 = require("../hooks");
const modals_types_1 = require("../../sagas/modals/modals.types");
const QuitAppDialog_1 = __importDefault(require("../../components/ui/QuitApp/QuitAppDialog"));
const electron_1 = require("electron");
const useQuitAppDialogActions = () => {
    const handleQuit = () => {
        electron_1.remote.app.relaunch();
        electron_1.remote.app.quit();
    };
    return { handleQuit };
};
const QuitAppDialogContainer = () => {
    const modal = (0, hooks_1.useModal)(modals_types_1.ModalName.quitApp);
    const { handleQuit } = useQuitAppDialogActions();
    return react_1.default.createElement(QuitAppDialog_1.default, { handleClose: modal.handleClose, open: modal.open, handleQuit: handleQuit });
};
exports.default = QuitAppDialogContainer;
