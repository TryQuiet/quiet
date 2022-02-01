"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const AddChannelAction_1 = require("./AddChannelAction");
const renderComponent_1 = require("../../../testUtils/renderComponent");
describe('BaseChannelsList', () => {
    // TODO: [refactoring] test useState when enzyme is up to date
    it('renders component', () => {
        const openModal = jest.fn();
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(AddChannelAction_1.AddChannelAction, { openCreateModal: openModal }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <button
            class="MuiButtonBase-root MuiIconButton-root makeStyles-button-3"
            tabindex="0"
            type="button"
          >
            <span
              class="MuiIconButton-label"
            >
              <img
                class="makeStyles-icon-2"
                src="test-file-stub"
              />
            </span>
          </button>
        </div>
      </body>
    `);
    });
});
