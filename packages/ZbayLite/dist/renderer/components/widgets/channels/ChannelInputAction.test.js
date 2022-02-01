"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const ChannelInputAction_1 = require("./ChannelInputAction");
const renderComponent_1 = require("../../../testUtils/renderComponent");
describe('ChannelInputAction', () => {
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(ChannelInputAction_1.ChannelInputAction, { disabled: false }));
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
