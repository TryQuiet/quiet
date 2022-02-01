"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseChannelsList = void 0;
const react_1 = __importDefault(require("react"));
const List_1 = __importDefault(require("@material-ui/core/List"));
const ChannelsListItem_1 = __importDefault(require("../../../containers/widgets/channels/ChannelsListItem"));
const BaseChannelsList = ({ channels = [] }) => {
    return (react_1.default.createElement(List_1.default, { disablePadding: true }, channels
        .map(channel => (react_1.default.createElement(ChannelsListItem_1.default, { key: channel.name, channel: channel })))));
};
exports.BaseChannelsList = BaseChannelsList;
exports.default = react_1.default.memo(exports.BaseChannelsList);
