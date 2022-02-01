"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const BlockedUsers_1 = __importDefault(require("../../../components/widgets/channelSettings/BlockedUsers"));
const BlockedUsersContainer = () => {
    return (react_1.default.createElement(BlockedUsers_1.default, { blockedUsers: [], unblockUser: () => { }, users: {} }));
};
exports.default = BlockedUsersContainer;
