"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const CreateChannelForm_1 = require("./CreateChannelForm");
const renderComponent_1 = require("../../../testUtils/renderComponent");
describe('CreateChannelForm', () => {
    it.skip('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(CreateChannelForm_1.CreateChannelForm
        // onSubmit={jest.fn()}
        , { 
            // onSubmit={jest.fn()}
            setStep: jest.fn() }));
        expect(result.baseElement).toMatchInlineSnapshot();
    });
});
