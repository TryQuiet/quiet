"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const NewMessageModal_1 = require("./NewMessageModal");
const renderComponent_1 = require("../../../testUtils/renderComponent");
describe('NewMessageModal', () => {
    it.skip('renders NewMessageModal', () => {
        const users = {};
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(NewMessageModal_1.NewMessageModal, { handleClose: jest.fn(), sendMessage: jest.fn(), open: true, users: users }));
        expect(result.baseElement).toMatchInlineSnapshot();
    });
});
