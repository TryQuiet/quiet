"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateChannelModalContainer = void 0;
const react_1 = __importDefault(require("react"));
const hooks_1 = require("../../hooks");
const modals_types_1 = require("../../../sagas/modals/modals.types");
const CreateChannelModal_1 = __importDefault(require("../../../components/widgets/channels/CreateChannelModal"));
const CreateChannelModalContainer = () => {
    const modal = (0, hooks_1.useModal)(modals_types_1.ModalName.createChannel);
    return react_1.default.createElement(CreateChannelModal_1.default, Object.assign({}, modal));
};
exports.CreateChannelModalContainer = CreateChannelModalContainer;
exports.default = exports.CreateChannelModalContainer;
