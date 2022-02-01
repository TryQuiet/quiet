"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const ChannelInfo_1 = require("./ChannelInfo");
describe('ChannelInfo', () => {
    it.skip('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(ChannelInfo_1.ChannelInfo, { initialValues: {
                updateChannelDescription: ''
            }, updateChannelSettings: () => { } }));
        expect(result.baseElement).toMatchInlineSnapshot();
    });
});
