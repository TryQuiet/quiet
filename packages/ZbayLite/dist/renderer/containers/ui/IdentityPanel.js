"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useIdentityPanelData = void 0;
const react_1 = __importDefault(require("react"));
const react_redux_1 = require("react-redux");
const IdentityPanel_1 = __importDefault(require("../../components/ui/IdentityPanel/IdentityPanel"));
const nectar_1 = require("@zbayapp/nectar");
const hooks_1 = require("../hooks");
const modals_types_1 = require("../../sagas/modals/modals.types");
const useIdentityPanelData = () => {
    const data = {
        community: (0, react_redux_1.useSelector)(nectar_1.communities.selectors.currentCommunity)
    };
    return data;
};
exports.useIdentityPanelData = useIdentityPanelData;
const IdentityPanel = () => {
    const { community } = (0, exports.useIdentityPanelData)();
    const modal = (0, hooks_1.useModal)(modals_types_1.ModalName.accountSettingsModal);
    return react_1.default.createElement(IdentityPanel_1.default, { community: community, handleSettings: modal.handleOpen });
};
exports.default = IdentityPanel;
