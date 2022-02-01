"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelsPanel = void 0;
const react_1 = __importDefault(require("react"));
const react_redux_1 = require("react-redux");
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const nectar_1 = require("@zbayapp/nectar");
const BaseChannelsList_1 = __importDefault(require("../../../components/widgets/channels/BaseChannelsList"));
const SidebarHeader_1 = __importDefault(require("../../../components/ui/Sidebar/SidebarHeader"));
const QuickActionButton_1 = __importDefault(require("../../../components/widgets/sidebar/QuickActionButton"));
const Icon_1 = require("../../../components/ui/Icon/Icon");
const st_search_svg_1 = __importDefault(require("../../../static/images/st-search.svg"));
const hooks_1 = require("../../hooks");
const modals_types_1 = require("../../../sagas/modals/modals.types");
const useChannelsPanelData = () => {
    const data = {
        channels: (0, react_redux_1.useSelector)(nectar_1.publicChannels.selectors.publicChannels)
    };
    return data;
};
const ChannelsPanel = ({ title }) => {
    const data = useChannelsPanelData();
    const joinChannelModal = (0, hooks_1.useModal)(modals_types_1.ModalName.joinChannel);
    const createChannelModal = (0, hooks_1.useModal)(modals_types_1.ModalName.createChannel);
    return (react_1.default.createElement(Grid_1.default, { container: true, item: true, xs: true, direction: 'column' },
        react_1.default.createElement(Grid_1.default, { item: true },
            react_1.default.createElement(SidebarHeader_1.default, { title: title, action: createChannelModal.handleOpen, actionTitle: joinChannelModal.handleOpen, tooltipText: 'Create new channel' })),
        react_1.default.createElement(Grid_1.default, { item: true },
            react_1.default.createElement(BaseChannelsList_1.default, { channels: data.channels })),
        react_1.default.createElement(Grid_1.default, { item: true },
            react_1.default.createElement(QuickActionButton_1.default, { text: 'Find Channel', action: joinChannelModal.handleOpen, icon: react_1.default.createElement(Icon_1.Icon, { src: st_search_svg_1.default }) }))));
};
exports.ChannelsPanel = ChannelsPanel;
exports.default = exports.ChannelsPanel;
