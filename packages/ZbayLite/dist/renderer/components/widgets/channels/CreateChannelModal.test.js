"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const CreateChannelModal_1 = require("./CreateChannelModal");
const renderComponent_1 = require("../../../testUtils/renderComponent");
const react_router_dom_1 = require("react-router-dom");
const react_redux_1 = require("react-redux");
const store_1 = __importDefault(require("../../../store"));
describe('CreateChannelModal', () => {
    it.skip('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_router_dom_1.HashRouter, null,
            react_1.default.createElement(react_redux_1.Provider, { store: store_1.default },
                react_1.default.createElement(CreateChannelModal_1.CreateChannelModal, { handleClose: jest.fn(), open: true }))));
        expect(result.baseElement).toMatchInlineSnapshot();
    });
    it.skip('renders closed component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(CreateChannelModal_1.CreateChannelModal, { handleClose: jest.fn(), open: true }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div />
      </body>
    `);
    });
});
