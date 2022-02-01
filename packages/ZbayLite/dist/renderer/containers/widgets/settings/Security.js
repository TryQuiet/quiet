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
exports.Security = exports.useSecurityActions = exports.useSecurityData = void 0;
const react_1 = __importStar(require("react"));
const react_redux_1 = require("react-redux");
const Security_1 = __importDefault(require("../../../components/widgets/settings/Security"));
const modals_types_1 = require("../../../sagas/modals/modals.types");
const whitelist_1 = __importDefault(require("../../../store/selectors/whitelist"));
const whitelist_2 = __importDefault(require("../../../store/handlers/whitelist"));
const hooks_1 = require("../../hooks");
const useSecurityData = () => {
    const data = {
        allowAll: (0, react_redux_1.useSelector)(whitelist_1.default.allowAll),
        whitelisted: (0, react_redux_1.useSelector)(whitelist_1.default.whitelisted),
        autoload: (0, react_redux_1.useSelector)(whitelist_1.default.autoload)
    };
    return data;
};
exports.useSecurityData = useSecurityData;
const useSecurityActions = (allowAll) => {
    const dispatch = (0, react_redux_1.useDispatch)();
    const toggleAllowAll = (0, react_1.useCallback)(() => {
        dispatch(whitelist_2.default.epics.setWhitelistAll(allowAll));
    }, [dispatch, allowAll]);
    const removeImageHost = (0, react_1.useCallback)((hostname) => {
        dispatch(whitelist_2.default.epics.removeImageHost(hostname));
    }, [dispatch]);
    const removeSiteHost = (0, react_1.useCallback)((hostname) => {
        dispatch(whitelist_2.default.epics.removeSiteHost(hostname));
    }, [dispatch]);
    return { toggleAllowAll, removeImageHost, removeSiteHost };
};
exports.useSecurityActions = useSecurityActions;
const Security = () => {
    const { allowAll, whitelisted } = (0, exports.useSecurityData)();
    const { removeSiteHost, toggleAllowAll } = (0, exports.useSecurityActions)(allowAll);
    const openSeedModal = (0, hooks_1.useModal)(modals_types_1.ModalName.seedModal);
    return (react_1.default.createElement(Security_1.default, { allowAll: allowAll, toggleAllowAll: toggleAllowAll, openSeedModal: openSeedModal.handleOpen, whitelisted: whitelisted, removeSiteHost: removeSiteHost }));
};
exports.Security = Security;
exports.default = exports.Security;
