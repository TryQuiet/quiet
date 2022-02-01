"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const IconButton_1 = require("./IconButton");
describe('IconButton', () => {
    const Icon = () => react_1.default.createElement("div", null, "Icon");
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(IconButton_1.IconButton, { onClick: jest.fn() },
            react_1.default.createElement(Icon, null)));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <button
            class="MuiButtonBase-root MuiIconButton-root makeStyles-root-1"
            tabindex="0"
            type="button"
          >
            <span
              class="MuiIconButton-label"
            >
              <div>
                Icon
              </div>
            </span>
            <span
              class="MuiTouchRipple-root"
            />
          </button>
        </div>
      </body>
    `);
    });
});
