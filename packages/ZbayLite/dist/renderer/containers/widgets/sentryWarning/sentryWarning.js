"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const SentryWarningComponent_1 = require("../../../components/widgets/sentryWarning/SentryWarningComponent");
const modals_types_1 = require("../../../sagas/modals/modals.types");
const hooks_1 = require("../../hooks");
const SentryWarning = () => {
    const modal = (0, hooks_1.useModal)(modals_types_1.ModalName.sentryWarningModal);
    (0, react_1.useEffect)(() => {
        if (process.env.REACT_APP_ENABLE_SENTRY === 'true') {
            modal.handleOpen();
        }
    }, [process.env.REACT_APP_ENABLE_SENTRY]);
    return react_1.default.createElement(SentryWarningComponent_1.SentryWarningComponent, Object.assign({}, modal));
};
exports.default = SentryWarning;
