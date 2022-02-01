"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Component = void 0;
const react_1 = __importDefault(require("react"));
const decorators_1 = require("../../../storybook/decorators");
const SentryWarningComponent_1 = require("./SentryWarningComponent");
const Template = args => {
    return react_1.default.createElement(SentryWarningComponent_1.SentryWarningComponent, Object.assign({}, args));
};
exports.Component = Template.bind({});
const args = {
    open: true,
    handleClose: function () {
        console.log('Closed modal');
    }
};
exports.Component.args = args;
const component = {
    title: 'Components/SentryWarning',
    decorators: [decorators_1.withTheme],
    component: SentryWarningComponent_1.SentryWarningComponent
};
exports.default = component;
