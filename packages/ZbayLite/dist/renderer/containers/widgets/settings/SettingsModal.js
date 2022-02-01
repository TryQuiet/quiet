"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_redux_1 = require("react-redux");
const SettingsModal_1 = __importDefault(require("../../../components/widgets/settings/SettingsModal"));
const modals_types_1 = require("../../../sagas/modals/modals.types");
const hooks_1 = require("../../hooks");
const nectar_1 = require("@zbayapp/nectar");
const SettingsModalContainer = () => {
    var _a;
    const modal = (0, hooks_1.useModal)(modals_types_1.ModalName.accountSettingsModal);
    const user = ((_a = (0, react_redux_1.useSelector)(nectar_1.identity.selectors.currentIdentity)) === null || _a === void 0 ? void 0 : _a.zbayNickname) || 'Settings';
    const owner = (0, react_redux_1.useSelector)(nectar_1.communities.selectors.isOwner);
    return react_1.default.createElement(SettingsModal_1.default, Object.assign({ user: user, owner: owner }, modal));
};
exports.default = SettingsModalContainer;
