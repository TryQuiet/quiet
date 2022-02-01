"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelMessages = void 0;
const react_1 = __importDefault(require("react"));
const react_redux_1 = require("react-redux");
const contacts_1 = __importDefault(require("../../../store/selectors/contacts"));
const ChannelMessages_1 = __importDefault(require("../../../components/widgets/channels/ChannelMessages"));
const ChannelMessages = ({ contactId }) => {
    const contact = (0, react_redux_1.useSelector)(contacts_1.default.contact(contactId));
    return react_1.default.createElement(ChannelMessages_1.default, { channel: contact.address });
};
exports.ChannelMessages = ChannelMessages;
exports.default = exports.ChannelMessages;
