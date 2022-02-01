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
Object.defineProperty(exports, "__esModule", { value: true });
exports.epics = exports.declineUpdate = exports.startApplicationUpdate = exports.checkForUpdate = void 0;
const electron_1 = require("electron");
const modals_types_1 = require("../../sagas/modals/modals.types");
const modals_slice_1 = require("../../sagas/modals/modals.slice");
const checkForUpdate = () => (dispatch) => __awaiter(void 0, void 0, void 0, function* () {
    dispatch(modals_slice_1.modalsActions.openModal({ name: modals_types_1.ModalName.applicationUpdate }));
});
exports.checkForUpdate = checkForUpdate;
const startApplicationUpdate = () => (dispatch) => __awaiter(void 0, void 0, void 0, function* () {
    electron_1.ipcRenderer.send('proceed-update');
    dispatch(modals_slice_1.modalsActions.closeModal(modals_types_1.ModalName.applicationUpdate));
});
exports.startApplicationUpdate = startApplicationUpdate;
const declineUpdate = () => (dispatch) => __awaiter(void 0, void 0, void 0, function* () {
    dispatch(modals_slice_1.modalsActions.closeModal(modals_types_1.ModalName.applicationUpdate));
});
exports.declineUpdate = declineUpdate;
exports.epics = {
    checkForUpdate: exports.checkForUpdate,
    startApplicationUpdate: exports.startApplicationUpdate,
    declineUpdate: exports.declineUpdate
};
exports.default = {
    epics: exports.epics
};
