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
exports.SendMessagePopover = exports.useSendMessagePopoverActions = exports.useSendMessagePopoverData = void 0;
const react_1 = __importStar(require("react"));
const react_redux_1 = require("react-redux");
const SendMessagePopover_1 = __importDefault(require("../../../components/widgets/channels/SendMessagePopover"));
// import identitySelectors from '../../../store/selectors/identity'
// import userSelectors from '../../../store/selectors/users'
const contacts_1 = __importDefault(require("../../../store/handlers/contacts"));
const directMessages_1 = __importDefault(require("../../../store/selectors/directMessages"));
const useSendMessagePopoverData = () => {
    const data = {
        // identityId: identitySelectors.id(state),
        // identityId: 'id',
        // users: userSelectors.users(state),
        users: [],
        waggleUsers: (0, react_redux_1.useSelector)(directMessages_1.default.users)
    };
    return data;
};
exports.useSendMessagePopoverData = useSendMessagePopoverData;
const useSendMessagePopoverActions = () => {
    const dispatch = (0, react_redux_1.useDispatch)();
    const createNewContact = (0, react_1.useCallback)((contact) => {
        dispatch(contacts_1.default.epics.createVaultContact(contact));
    }, [dispatch]);
    return { createNewContact };
};
exports.useSendMessagePopoverActions = useSendMessagePopoverActions;
const SendMessagePopover = ({ username, anchorEl, handleClose }) => {
    const { users, waggleUsers } = (0, exports.useSendMessagePopoverData)();
    const { createNewContact } = (0, exports.useSendMessagePopoverActions)();
    return (react_1.default.createElement(SendMessagePopover_1.default, { username: username, anchorEl: anchorEl, users: users, waggleUsers: waggleUsers, createNewContact: createNewContact, handleClose: handleClose, isUnregistered: false }));
};
exports.SendMessagePopover = SendMessagePopover;
exports.default = exports.SendMessagePopover;
