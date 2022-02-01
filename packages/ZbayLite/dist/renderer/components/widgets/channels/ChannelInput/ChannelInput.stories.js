"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Component = void 0;
const react_1 = __importDefault(require("react"));
const ChannelInput_1 = require("./ChannelInput");
const decorators_1 = require("../../../../storybook/decorators");
const Template = args => {
    return (react_1.default.createElement("div", { style: { height: '400px', position: 'relative' } },
        react_1.default.createElement(ChannelInput_1.ChannelInputComponent, Object.assign({}, args))));
};
exports.Component = Template.bind({});
const args = {
    channelAddress: 'channelAddress',
    channelParticipants: [{ nickname: 'john' }, { nickname: 'emily' }],
    inputPlaceholder: '#general as @alice',
    onChange: function (_arg) { },
    onKeyPress: function (input) {
        console.log('send message', input);
    },
    infoClass: '',
    setInfoClass: function (_arg) { }
};
exports.Component.args = args;
const component = {
    title: 'Components/ChannelInput',
    decorators: [decorators_1.withTheme],
    component: ChannelInput_1.ChannelInputComponent
};
exports.default = component;
