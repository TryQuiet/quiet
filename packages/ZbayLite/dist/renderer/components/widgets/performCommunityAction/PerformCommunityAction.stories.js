"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Component = void 0;
const react_1 = __importDefault(require("react"));
const decorators_1 = require("../../../storybook/decorators");
const PerformCommunityActionComponent_1 = __importDefault(require("./PerformCommunityActionComponent"));
const community_keys_1 = require("./community.keys");
const Template = args => {
    return react_1.default.createElement(PerformCommunityActionComponent_1.default, Object.assign({}, args));
};
exports.Component = Template.bind({});
const args = {
    open: true,
    communityAction: community_keys_1.CommunityAction.Create,
    handleCommunityAction: function () {
        console.log('Handle community action');
    },
    handleRedirection: function () {
        console.log('Redirected to join community');
    },
    handleClose: function () { },
    community: true
};
exports.Component.args = args;
const component = {
    title: 'Components/PerformCommunityAction',
    decorators: [decorators_1.withTheme],
    component: PerformCommunityActionComponent_1.default
};
exports.default = component;
