"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Component = void 0;
const react_1 = __importDefault(require("react"));
const MentionElement_1 = __importDefault(require("./MentionElement"));
const decorators_1 = require("../../../../storybook/decorators");
const Template = args => {
    return react_1.default.createElement(MentionElement_1.default, Object.assign({}, args));
};
exports.Component = Template.bind({});
const args = {
    name: '',
    channelName: 'general',
    onMouseEnter: function () { },
    onClick: function () { },
    participant: true,
    highlight: false
};
exports.Component.args = args;
const component = {
    title: 'Components/MentionElement',
    decorators: [decorators_1.withTheme],
    component: MentionElement_1.default
};
exports.default = component;
