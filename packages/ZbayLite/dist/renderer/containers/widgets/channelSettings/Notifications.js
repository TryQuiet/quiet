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
exports.Notifications = exports.useNotificationsActions = exports.useNotificationsData = void 0;
const react_1 = __importStar(require("react"));
const react_redux_1 = require("react-redux");
const notificationCenter_1 = __importDefault(require("../../../store/handlers/notificationCenter"));
const Notifications_1 = __importDefault(require("../../../components/widgets/channelSettings/Notifications"));
const notificationCenter_2 = __importDefault(require("../../../store/selectors/notificationCenter"));
const channel_1 = __importDefault(require("../../../store/selectors/channel"));
const app_1 = __importDefault(require("../../../store/handlers/app"));
const contacts_1 = __importDefault(require("../../../store/selectors/contacts"));
const modals_types_1 = require("../../../sagas/modals/modals.types");
const hooks_1 = require("../../hooks");
const useNotificationsData = () => {
    const channel = (0, react_redux_1.useSelector)(channel_1.default.channel).address;
    const data = {
        currentFilter: (0, react_redux_1.useSelector)(notificationCenter_2.default.channelFilterById(channel)),
        channelData: (0, react_redux_1.useSelector)(contacts_1.default.contact(channel))
    };
    return data;
};
exports.useNotificationsData = useNotificationsData;
const useNotificationsActions = (currentFilter) => {
    const dispatch = (0, react_redux_1.useDispatch)();
    const setChannelsNotification = (0, react_1.useCallback)(() => {
        dispatch(notificationCenter_1.default.epics.setChannelsNotification(currentFilter));
    }, [dispatch, currentFilter]);
    const openNotificationsTab = (0, react_1.useCallback)(() => {
        dispatch(app_1.default.actions.setModalTab('notifications'));
    }, [dispatch]);
    return { setChannelsNotification, openNotificationsTab };
};
exports.useNotificationsActions = useNotificationsActions;
const Notifications = () => {
    const { channelData, currentFilter } = (0, exports.useNotificationsData)();
    const { openNotificationsTab, setChannelsNotification } = (0, exports.useNotificationsActions)(currentFilter);
    const openSettingsModal = (0, hooks_1.useModal)(modals_types_1.ModalName.accountSettingsModal);
    return (react_1.default.createElement(Notifications_1.default, { channelData: channelData, currentFilter: currentFilter, openNotificationsTab: openNotificationsTab, openSettingsModal: openSettingsModal.handleOpen, setChannelsNotification: setChannelsNotification }));
};
exports.Notifications = Notifications;
exports.default = exports.Notifications;
