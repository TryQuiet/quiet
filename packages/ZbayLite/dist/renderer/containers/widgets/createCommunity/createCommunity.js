"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_redux_1 = require("react-redux");
const community_keys_1 = require("../../../components/widgets/performCommunityAction/community.keys");
const PerformCommunityActionComponent_1 = __importDefault(require("../../../components/widgets/performCommunityAction/PerformCommunityActionComponent"));
const modals_types_1 = require("../../../sagas/modals/modals.types");
const hooks_1 = require("../../hooks");
const socket_selectors_1 = require("../../../sagas/socket/socket.selectors");
const nectar_1 = require("@zbayapp/nectar");
const CreateCommunity = () => {
    const isConnected = (0, react_redux_1.useSelector)(socket_selectors_1.socketSelectors.isConnected);
    const community = (0, react_redux_1.useSelector)(nectar_1.communities.selectors.currentCommunity);
    const createCommunityModal = (0, hooks_1.useModal)(modals_types_1.ModalName.createCommunityModal);
    const joinCommunityModal = (0, hooks_1.useModal)(modals_types_1.ModalName.joinCommunityModal);
    const createUsernameModal = (0, hooks_1.useModal)(modals_types_1.ModalName.createUsernameModal);
    const handleCommunityAction = (name) => {
        createUsernameModal.handleOpen({
            communityAction: community_keys_1.CommunityAction.Create,
            communityData: name
        });
    };
    const handleRedirection = () => {
        if (!joinCommunityModal.open) {
            joinCommunityModal.handleOpen();
        }
        else {
            createCommunityModal.handleClose();
        }
    };
    return (react_1.default.createElement(PerformCommunityActionComponent_1.default, Object.assign({}, createCommunityModal, { communityAction: community_keys_1.CommunityAction.Create, handleCommunityAction: handleCommunityAction, handleRedirection: handleRedirection, isConnectionReady: isConnected, community: Boolean(community) })));
};
exports.default = CreateCommunity;
