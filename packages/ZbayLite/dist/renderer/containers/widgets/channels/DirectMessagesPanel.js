"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectMessagesPanel = exports.useDirectMessagesPanelData = void 0;
const react_1 = __importDefault(require("react"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const SidebarHeader_1 = __importDefault(require("../../../components/ui/Sidebar/SidebarHeader"));
const QuickActionButton_1 = __importDefault(require("../../../components/widgets/sidebar/QuickActionButton"));
const BaseChannelsList_1 = __importDefault(require("../../../components/widgets/channels/BaseChannelsList"));
const hooks_1 = require("../../hooks");
const modals_types_1 = require("../../../sagas/modals/modals.types");
const useDirectMessagesPanelData = () => {
    const data = {
        channels: []
    };
    return data;
};
exports.useDirectMessagesPanelData = useDirectMessagesPanelData;
const DirectMessagesPanel = ({ title }) => {
    const modal = (0, hooks_1.useModal)(modals_types_1.ModalName.newMessageSeparate);
    const { channels } = (0, exports.useDirectMessagesPanelData)();
    return (react_1.default.createElement(Grid_1.default, { container: true, item: true, xs: true, direction: 'column' },
        react_1.default.createElement(Grid_1.default, { item: true },
            react_1.default.createElement(SidebarHeader_1.default, { title: title, action: modal.handleOpen, tooltipText: 'Create new message' })),
        react_1.default.createElement(Grid_1.default, { item: true },
            react_1.default.createElement(BaseChannelsList_1.default, { channels: channels })),
        react_1.default.createElement(Grid_1.default, { item: true },
            react_1.default.createElement(QuickActionButton_1.default, { text: 'New Message', action: modal.handleOpen }))));
};
exports.DirectMessagesPanel = DirectMessagesPanel;
exports.default = exports.DirectMessagesPanel;
