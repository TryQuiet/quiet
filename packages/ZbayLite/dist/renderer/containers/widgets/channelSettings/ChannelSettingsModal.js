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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const redux_1 = require("redux");
const react_redux_1 = require("react-redux");
const ChannelSettingsModal_1 = __importDefault(require("../../../components/widgets/channelSettings/ChannelSettingsModal"));
const hooks_1 = require("../../hooks");
const modals_types_1 = require("../../../sagas/modals/modals.types");
const app_1 = require("../../../store/handlers/app");
const channel_1 = __importDefault(require("../../../store/selectors/channel"));
const app_2 = __importDefault(require("../../../store/selectors/app"));
const contacts_1 = __importDefault(require("../../../store/selectors/contacts"));
const ChannelSettingsModal = () => {
    const [currentTab, setCurrentTab] = (0, react_1.useState)('channelInfo');
    const modal = (0, hooks_1.useModal)(modals_types_1.ModalName.channelSettingsModal);
    const address = (0, react_redux_1.useSelector)(channel_1.default.channel);
    const channel = (0, react_redux_1.useSelector)(contacts_1.default.contact(address));
    const modalTabToOpen = (0, react_redux_1.useSelector)(app_2.default.currentModalTab);
    const dispatch = (0, react_redux_1.useDispatch)();
    const { clearCurrentOpenTab } = (0, redux_1.bindActionCreators)({
        clearCurrentOpenTab: app_1.actions.clearModalTab
    }, dispatch);
    return (react_1.default.createElement(ChannelSettingsModal_1.default, Object.assign({}, modal, { modalTabToOpen: modalTabToOpen, isOwner: false, channel: channel, clearCurrentOpenTab: clearCurrentOpenTab, setCurrentTab: setCurrentTab, currentTab: currentTab })));
};
exports.default = ChannelSettingsModal;
