"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockedUsers = exports.useBlockedUsersActions = exports.useBlockedUsersData = void 0;
const react_1 = __importDefault(require("react"));
const react_redux_1 = require("react-redux");
const notificationCenter_1 = __importDefault(require("../../../store/handlers/notificationCenter"));
const BlockedUsers_1 = __importDefault(require("../../../components/widgets/settings/BlockedUsers"));
const useBlockedUsersData = () => {
    const data = {
        users: [],
        // blockedUsers: useSelector(notificationCenterSelector.blockedUsers) ?????????????
        blockedUsers: []
    };
    return data;
};
exports.useBlockedUsersData = useBlockedUsersData;
const useBlockedUsersActions = () => {
    const dispatch = (0, react_redux_1.useDispatch)();
    const unblock = (address) => dispatch(notificationCenter_1.default.epics.unblockUserNotification(address));
    return { unblock };
};
exports.useBlockedUsersActions = useBlockedUsersActions;
const BlockedUsers = () => {
    const { users, blockedUsers } = (0, exports.useBlockedUsersData)();
    const { unblock } = (0, exports.useBlockedUsersActions)();
    return react_1.default.createElement(BlockedUsers_1.default, { unblock: unblock, users: users, blockedUsers: blockedUsers });
};
exports.BlockedUsers = BlockedUsers;
exports.default = exports.BlockedUsers;
