"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const hooks_1 = require("../../hooks");
const NewMessageModal_1 = __importDefault(require("../../../components/widgets/channels/NewMessageModal"));
const modals_types_1 = require("../../../sagas/modals/modals.types");
const NewMessage = () => {
    const modal = (0, hooks_1.useModal)(modals_types_1.ModalName.newMessageSeparate);
    return react_1.default.createElement(NewMessageModal_1.default, Object.assign({}, modal, { users: {}, sendMessage: () => null }));
};
exports.default = NewMessage;
