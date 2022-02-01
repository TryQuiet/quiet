"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Component = void 0;
const react_1 = __importDefault(require("react"));
const decorators_1 = require("../../../storybook/decorators");
const TextWithLink_1 = __importDefault(require("./TextWithLink"));
const Template = args => {
    return react_1.default.createElement(TextWithLink_1.default, Object.assign({}, args));
};
exports.Component = Template.bind({});
const args = {
    text: 'Here is %a text',
    links: [
        {
            tag: 'a',
            label: 'linked',
            action: () => {
                console.log('link clicked');
            }
        }
    ]
};
exports.Component.args = args;
const component = {
    title: 'Components/TextWithLink',
    decorators: [decorators_1.withTheme],
    component: TextWithLink_1.default
};
exports.default = component;
