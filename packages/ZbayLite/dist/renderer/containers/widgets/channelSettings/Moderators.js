"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Moderators_1 = __importDefault(require("../../../components/widgets/channelSettings/Moderators"));
const modals_types_1 = require("../../../sagas/modals/modals.types");
const hooks_1 = require("../../hooks");
const ModeratorsContainer = () => {
    const openAddModerator = (0, hooks_1.useModal)(modals_types_1.ModalName.addModerator);
    return react_1.default.createElement(Moderators_1.default, { openAddModerator: openAddModerator.handleOpen, moderators: [], users: {} });
};
exports.default = ModeratorsContainer;
