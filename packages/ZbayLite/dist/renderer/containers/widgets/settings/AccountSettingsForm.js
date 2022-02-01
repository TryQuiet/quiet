"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountSettingsForm = void 0;
const react_1 = __importDefault(require("react"));
const react_redux_1 = require("react-redux");
const AccountSettingsForm_1 = __importDefault(require("../../../components/widgets/settings/AccountSettingsForm"));
const nectar_1 = require("@zbayapp/nectar");
const useData = () => {
    const data = {
        user: (0, react_redux_1.useSelector)(nectar_1.identity.selectors.currentIdentity)
    };
    return data;
};
const AccountSettingsForm = () => {
    const { user } = useData();
    return (react_1.default.createElement(AccountSettingsForm_1.default, { user: user }));
};
exports.AccountSettingsForm = AccountSettingsForm;
exports.default = exports.AccountSettingsForm;
