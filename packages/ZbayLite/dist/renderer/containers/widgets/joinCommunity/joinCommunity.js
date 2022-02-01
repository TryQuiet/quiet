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
const react_redux_1 = require("react-redux");
const nectar_1 = require("@zbayapp/nectar");
const community_keys_1 = require("../../../components/widgets/performCommunityAction/community.keys");
const PerformCommunityActionComponent_1 = __importDefault(require("../../../components/widgets/performCommunityAction/PerformCommunityActionComponent"));
const modals_types_1 = require("../../../sagas/modals/modals.types");
const hooks_1 = require("../../hooks");
const socket_selectors_1 = require("../../../sagas/socket/socket.selectors");
const loadingMessages_1 = require("../loadingPanel/loadingMessages");
const JoinCommunity = () => {
    const dispatch = (0, react_redux_1.useDispatch)();
    const isConnected = (0, react_redux_1.useSelector)(socket_selectors_1.socketSelectors.isConnected);
    const community = (0, react_redux_1.useSelector)(nectar_1.communities.selectors.currentCommunity);
    const joinCommunityModal = (0, hooks_1.useModal)(modals_types_1.ModalName.joinCommunityModal);
    const createCommunityModal = (0, hooks_1.useModal)(modals_types_1.ModalName.createCommunityModal);
    const createUsernameModal = (0, hooks_1.useModal)(modals_types_1.ModalName.createUsernameModal);
    const loadingStartApp = (0, hooks_1.useModal)(modals_types_1.ModalName.loadingPanel);
    (0, react_1.useEffect)(() => {
        if (!loadingStartApp.open && !isConnected) {
            loadingStartApp.handleOpen({
                message: loadingMessages_1.LoadingMessages.StartApp
            });
        }
    }, [community, loadingStartApp, dispatch]);
    (0, react_1.useEffect)(() => {
        if (isConnected) {
            loadingStartApp.handleClose();
        }
    }, [isConnected]);
    (0, react_1.useEffect)(() => {
        if (!community && !joinCommunityModal.open) {
            joinCommunityModal.handleOpen();
        }
    }, [community, joinCommunityModal, dispatch]);
    const handleCommunityAction = (address) => {
        createUsernameModal.handleOpen({
            communityAction: community_keys_1.CommunityAction.Join,
            communityData: address
        });
    };
    const handleRedirection = () => {
        if (!createCommunityModal.open) {
            createCommunityModal.handleOpen();
        }
        else {
            joinCommunityModal.handleClose();
        }
    };
    return (react_1.default.createElement(PerformCommunityActionComponent_1.default, Object.assign({}, joinCommunityModal, { communityAction: community_keys_1.CommunityAction.Join, handleCommunityAction: handleCommunityAction, handleRedirection: handleRedirection, isConnectionReady: isConnected, community: Boolean(community) })));
};
exports.default = JoinCommunity;
