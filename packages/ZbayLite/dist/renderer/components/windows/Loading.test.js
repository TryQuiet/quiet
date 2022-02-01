"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../testUtils/renderComponent");
const Loading_1 = require("./Loading");
describe('Loading', () => {
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(Loading_1.Loading, { message: 'test Msg' }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root makeStyles-root-1 MuiGrid-container MuiGrid-direction-xs-column MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
          >
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-justify-xs-center"
            >
              <img
                class="makeStyles-icon-2"
                src="test-file-stub"
              />
            </div>
            <div
              class="MuiGrid-root makeStyles-progressBarContainer-4 MuiGrid-item"
            >
              <div
                class="MuiLinearProgress-root MuiLinearProgress-colorPrimary makeStyles-progressBar-5 MuiLinearProgress-indeterminate"
                role="progressbar"
              >
                <div
                  class="MuiLinearProgress-bar MuiLinearProgress-barColorPrimary MuiLinearProgress-bar1Indeterminate"
                />
                <div
                  class="MuiLinearProgress-bar MuiLinearProgress-bar2Indeterminate MuiLinearProgress-barColorPrimary"
                />
              </div>
            </div>
            <div
              class="MuiGrid-root makeStyles-messageContainer-7 MuiGrid-item"
            >
              <span
                class="MuiTypography-root makeStyles-message-8 MuiTypography-caption"
              >
                test Msg
              </span>
            </div>
          </div>
        </div>
      </body>
    `);
    });
});
