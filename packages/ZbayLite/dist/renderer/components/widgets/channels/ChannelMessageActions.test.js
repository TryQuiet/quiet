"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const ChannelMessageActions_1 = require("./ChannelMessageActions");
const renderComponent_1 = require("../../../testUtils/renderComponent");
describe('ChannelMessageActions', () => {
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(ChannelMessageActions_1.ChannelMessageActions, { onResend: jest.fn() }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center"
          >
            <img
              src="test-file-stub"
            />
            <div
              class="MuiGrid-root MuiGrid-item"
            >
              <span
                class="MuiTypography-root makeStyles-warrning-1 MuiTypography-caption"
              >
                Coudn't send.
              </span>
            </div>
            <div
              class="MuiGrid-root makeStyles-pointer-3 MuiGrid-item"
            >
              <span
                class="MuiTypography-root makeStyles-tryAgain-2 MuiTypography-caption"
              >
                Try again
              </span>
            </div>
          </div>
        </div>
      </body>
    `);
    });
});
