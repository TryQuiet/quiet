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
const CreateUsernameModal_1 = __importDefault(require("../../../components/widgets/createUsername/CreateUsernameModal"));
const modals_types_1 = require("../../../sagas/modals/modals.types");
const hooks_1 = require("../../hooks");
const community_keys_1 = require("../../../components/widgets/performCommunityAction/community.keys");
const loadingMessages_1 = require("../loadingPanel/loadingMessages");
const socket_selectors_1 = require("../../../sagas/socket/socket.selectors");
const CreateUsernameModal = () => {
    var _a;
    const dispatch = (0, react_redux_1.useDispatch)();
    const [username, setUsername] = (0, react_1.useState)('');
    const id = (0, react_redux_1.useSelector)(nectar_1.identity.selectors.currentIdentity);
    const certificate = (_a = (0, react_redux_1.useSelector)(nectar_1.identity.selectors.currentIdentity)) === null || _a === void 0 ? void 0 : _a.userCertificate;
    const communityErrors = (0, react_redux_1.useSelector)(nectar_1.errors.selectors.currentCommunityErrorsByType);
    const error = communityErrors === null || communityErrors === void 0 ? void 0 : communityErrors[nectar_1.socketActionTypes.REGISTRAR];
    const currentCommunityId = (0, react_redux_1.useSelector)(nectar_1.communities.selectors.currentCommunityId);
    const invitationUrl = (0, react_redux_1.useSelector)(nectar_1.communities.selectors.registrarUrl(currentCommunityId));
    const channels = (0, react_redux_1.useSelector)(nectar_1.publicChannels.selectors.publicChannels);
    const initializedCommunitiesCount = Object.keys((0, react_redux_1.useSelector)(nectar_1.connection.selectors.initializedCommunities)).length;
    const allCommunitiesCount = (0, react_redux_1.useSelector)(nectar_1.communities.selectors.allCommunities).length;
    const allCommunitiesInitialized = allCommunitiesCount > 0 && initializedCommunitiesCount === allCommunitiesCount;
    const createUsernameModal = (0, hooks_1.useModal)(modals_types_1.ModalName.createUsernameModal);
    const joinCommunityModal = (0, hooks_1.useModal)(modals_types_1.ModalName.joinCommunityModal);
    const createCommunityModal = (0, hooks_1.useModal)(modals_types_1.ModalName.createCommunityModal);
    const loadingCommunityModal = (0, hooks_1.useModal)(modals_types_1.ModalName.loadingPanel);
    const initializedCommunities = (0, react_redux_1.useSelector)(nectar_1.identity.selectors.unregisteredCommunitiesWithoutUserIdentity);
    const isInitializedCommunity = initializedCommunities.length;
    const [isCreateUserNameStarted, setIsCreateUserNameStarted] = (0, react_1.useState)(false);
    const [isRetryingRegistration, setIsRetryingRegistration] = (0, react_1.useState)(false);
    const isConnected = (0, react_redux_1.useSelector)(socket_selectors_1.socketSelectors.isConnected);
    const unregisteredCommunities = (0, react_redux_1.useSelector)(nectar_1.identity.selectors.unregisteredCommunities);
    const isUnregisteredCommunity = unregisteredCommunities.length;
    const isOwner = (0, react_redux_1.useSelector)(nectar_1.communities.selectors.isOwner);
    (0, react_1.useEffect)(() => {
        if (isConnected && isInitializedCommunity && !isCreateUserNameStarted) {
            let communityAction;
            isOwner ? communityAction = community_keys_1.CommunityAction.Create : communityAction = community_keys_1.CommunityAction.Join;
            setIsRetryingRegistration(true);
            createUsernameModal.handleOpen({
                communityAction: communityAction,
                communityData: initializedCommunities[0].registrarUrl
            });
        }
    }, [initializedCommunities, isConnected, isCreateUserNameStarted]);
    (0, react_1.useEffect)(() => {
        let communityMessage;
        if (isUnregisteredCommunity && !loadingCommunityModal.open) {
            isOwner ? communityMessage = loadingMessages_1.LoadingMessages.CreateCommunity : communityMessage = loadingMessages_1.LoadingMessages.JoinCommunity;
            loadingCommunityModal.handleOpen({
                message: communityMessage
            });
        }
    }, [unregisteredCommunities]);
    (0, react_1.useEffect)(() => {
        if (!createUsernameModal.communityAction) {
            isOwner ? createUsernameModal.communityAction = community_keys_1.CommunityAction.Create : createUsernameModal.communityAction = community_keys_1.CommunityAction.Join;
        }
        if (certificate && allCommunitiesInitialized && !isInitializedCommunity &&
            ((createUsernameModal.communityAction === community_keys_1.CommunityAction.Join && channels.length) ||
                (createUsernameModal.communityAction === community_keys_1.CommunityAction.Create && invitationUrl))) {
            loadingCommunityModal.handleClose();
            createUsernameModal.handleClose();
            joinCommunityModal.handleClose();
            createCommunityModal.handleClose();
        }
    }, [channels.length, invitationUrl, certificate, allCommunitiesInitialized, initializedCommunities, unregisteredCommunities]);
    (0, react_1.useEffect)(() => {
        if ((id === null || id === void 0 ? void 0 : id.hiddenService) && !certificate) {
            dispatch(nectar_1.identity.actions.registerUsername(username));
        }
    }, [id === null || id === void 0 ? void 0 : id.hiddenService]);
    (0, react_1.useEffect)(() => {
        if ((error === null || error === void 0 ? void 0 : error.code) === nectar_1.ErrorCodes.VALIDATION) {
            loadingCommunityModal.handleClose();
        }
    }, [error]);
    const handleAction = (payload) => {
        setIsCreateUserNameStarted(true);
        setUsername(payload.nickname);
        const value = createUsernameModal.communityData;
        let action;
        /* Launch/create community */
        if (isRetryingRegistration) {
            dispatch(nectar_1.communities.actions.removeUnregisteredCommunity(initializedCommunities[0]));
            action =
                createUsernameModal.communityAction === community_keys_1.CommunityAction.Create
                    ? nectar_1.communities.actions.createNewCommunity(initializedCommunities[0].name)
                    : nectar_1.communities.actions.joinCommunity(initializedCommunities[0].registrarUrl);
        }
        else {
            action =
                createUsernameModal.communityAction === community_keys_1.CommunityAction.Create
                    ? nectar_1.communities.actions.createNewCommunity(value)
                    : nectar_1.communities.actions.joinCommunity(value);
        }
        const message = createUsernameModal.communityAction === community_keys_1.CommunityAction.Create
            ? loadingMessages_1.LoadingMessages.CreateCommunity
            : loadingMessages_1.LoadingMessages.JoinCommunity;
        loadingCommunityModal.handleOpen({
            message
        });
        dispatch(action);
    };
    return (react_1.default.createElement(CreateUsernameModal_1.default, Object.assign({}, createUsernameModal, { handleRegisterUsername: handleAction, certificateRegistrationError: error === null || error === void 0 ? void 0 : error.message, certificate: certificate })));
};
exports.default = CreateUsernameModal;
