"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JoinCommunityDictionary = exports.CreateCommunityDictionary = void 0;
const react_1 = __importDefault(require("react"));
const communityFields_1 = require("../../../forms/fields/communityFields");
const TextWithLink_1 = __importDefault(require("../../ui/TextWithLink/TextWithLink"));
const CreateCommunityDictionary = (handleRedirection) => {
    let link;
    if (handleRedirection) {
        link = (react_1.default.createElement(TextWithLink_1.default, { text: 'You can %link instead', links: [
                {
                    tag: 'link',
                    label: 'join a community',
                    action: handleRedirection
                }
            ], testIdPrefix: 'CreateCommunity' }));
    }
    return {
        header: 'Create your community',
        label: 'Community name',
        placeholder: 'Community name',
        hint: '',
        button: 'Continue',
        field: (0, communityFields_1.communityNameField)(),
        redirection: link
    };
};
exports.CreateCommunityDictionary = CreateCommunityDictionary;
const JoinCommunityDictionary = (handleRedirection) => {
    let link;
    if (handleRedirection) {
        link = (react_1.default.createElement(TextWithLink_1.default, { text: 'You can %link instead', links: [
                {
                    tag: 'link',
                    label: 'create a new community',
                    action: handleRedirection
                }
            ], testIdPrefix: 'JoinCommunity' }));
    }
    return {
        header: 'Join community',
        label: 'Paste your invite link to join an existing community',
        placeholder: 'Invite link',
        hint: '',
        button: 'Continue',
        field: (0, communityFields_1.inviteLinkField)(),
        redirection: link
    };
};
exports.JoinCommunityDictionary = JoinCommunityDictionary;
