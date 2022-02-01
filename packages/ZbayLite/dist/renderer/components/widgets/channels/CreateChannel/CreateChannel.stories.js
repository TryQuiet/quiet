"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Component = void 0;
const react_1 = __importDefault(require("react"));
const decorators_1 = require("../../../../storybook/decorators");
const CreateChannel_1 = __importDefault(require("./CreateChannel"));
const Template = args => {
    return react_1.default.createElement(CreateChannel_1.default, Object.assign({}, args));
};
exports.Component = Template.bind({});
const args = {
    open: true,
    createChannel: function (name) {
        console.log('creating channel: ', name);
    },
    handleClose: function () { }
};
exports.Component.args = args;
const component = {
    title: 'Components/CreateChannel',
    decorators: [decorators_1.withTheme],
    component: CreateChannel_1.default
};
exports.default = component;
