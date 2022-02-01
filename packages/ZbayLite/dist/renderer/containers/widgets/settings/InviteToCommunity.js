"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nectar_1 = require("@zbayapp/nectar");
const react_1 = __importDefault(require("react"));
const react_redux_1 = require("react-redux");
const InviteToCommunity_1 = require("../../../components/widgets/settings/InviteToCommunity");
const InviteToCommunityTab = () => {
    const community = (0, react_redux_1.useSelector)(nectar_1.communities.selectors.currentCommunity);
    const invitationUrl = (0, react_redux_1.useSelector)(nectar_1.communities.selectors.registrarUrl(community === null || community === void 0 ? void 0 : community.id));
    return react_1.default.createElement(InviteToCommunity_1.InviteToCommunity, { communityName: community === null || community === void 0 ? void 0 : community.name, invitationUrl: invitationUrl });
};
exports.default = InviteToCommunityTab;
