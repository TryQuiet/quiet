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
const notificationCenter_1 = __importDefault(require("../../../store/selectors/notificationCenter"));
const notificationCenter_2 = __importDefault(require("../../../store/handlers/notificationCenter"));
const Notifications_1 = __importDefault(require("../../../components/widgets/settings/Notifications"));
const useNotificationsData = () => {
    const data = {
        userFilterType: (0, react_redux_1.useSelector)(notificationCenter_1.default.userFilterType),
        userSound: (0, react_redux_1.useSelector)(notificationCenter_1.default.userSound)
    };
    return data;
};
exports.useNotificationsData = useNotificationsData;
const useNotificationsActions = (userFilterType, sound) => {
    const dispatch = (0, react_redux_1.useDispatch)();
    const setUserNotification = (0, react_1.useCallback)(() => {
        dispatch(notificationCenter_2.default.epics.setUserNotification(userFilterType));
    }, [dispatch, userFilterType]);
    const setUserNotificationsSound = (0, react_1.useCallback)(() => {
        dispatch(notificationCenter_2.default.epics.setUserNotificationsSound(sound));
    }, [dispatch, sound]);
    return { setUserNotification, setUserNotificationsSound };
};
exports.useNotificationsActions = useNotificationsActions;
const Notifications = () => {
    const { userFilterType, userSound } = (0, exports.useNotificationsData)();
    const { setUserNotification, setUserNotificationsSound } = (0, exports.useNotificationsActions)(userFilterType, userSound);
    return (react_1.default.createElement(Notifications_1.default, { userFilterType: userFilterType, userSound: userSound, setUserNotification: setUserNotification, setUserNotificationsSound: setUserNotificationsSound }));
};
exports.Notifications = Notifications;
exports.default = exports.Notifications;
