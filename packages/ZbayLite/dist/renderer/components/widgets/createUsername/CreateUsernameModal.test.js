"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint import/first: 0 */
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const CreateUsernameModal_1 = require("./CreateUsernameModal");
describe('CreateUsernameModal', () => {
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(CreateUsernameModal_1.CreateUsernameModal, { handleClose: jest.fn(), open: false }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div />
      </body>
    `);
    });
});
