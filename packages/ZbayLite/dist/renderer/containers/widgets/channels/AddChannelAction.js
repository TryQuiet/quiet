"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddChannelActionContainer = void 0;
const react_1 = __importDefault(require("react"));
const AddChannelAction_1 = __importDefault(require("../../../components/widgets/channels/AddChannelAction"));
const hooks_1 = require("../../hooks");
const modals_types_1 = require("../../../sagas/modals/modals.types");
const AddChannelActionContainer = () => {
    const modal = (0, hooks_1.useModal)(modals_types_1.ModalName.createChannel);
    return react_1.default.createElement(AddChannelAction_1.default, { openCreateModal: modal.handleOpen });
};
exports.AddChannelActionContainer = AddChannelActionContainer;
exports.default = exports.AddChannelActionContainer;
