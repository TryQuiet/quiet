"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const LoadingButton_1 = require("./LoadingButton");
describe('Loading button', () => {
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(LoadingButton_1.LoadingButton, { text: 'Loading...' }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <button
            class="MuiButtonBase-root MuiButton-root MuiButton-text makeStyles-button-1"
            tabindex="0"
            type="button"
          >
            <span
              class="MuiButton-label"
            >
              Loading...
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
