"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const hooks_1 = require("../../hooks");
const modals_types_1 = require("../../../sagas/modals/modals.types");
const loadingPanel_1 = __importDefault(require("../../../components/widgets/loadingPanel/loadingPanel"));
const LoadingStartApp = () => {
    const loadingStartApp = (0, hooks_1.useModal)(modals_types_1.ModalName.loadingPanel);
    return (react_1.default.createElement(loadingPanel_1.default, Object.assign({}, loadingStartApp, { isClosedDisabled: true })));
};
exports.default = LoadingStartApp;
