"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint import/first: 0 */
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../testUtils/renderComponent");
const Index_1 = require("./Index");
describe('Index', () => {
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(Index_1.Index, { bootstrapping: true, bootstrappingMessage: 'Launching node' }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-wrapper-3 makeStyles-root-1"
          >
            <div
              class="MuiGrid-root makeStyles-root-4 MuiGrid-container MuiGrid-direction-xs-column MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-justify-xs-center"
              >
                <img
                  class="makeStyles-icon-5"
                  src="test-file-stub"
                />
              </div>
              <div
                class="MuiGrid-root makeStyles-progressBarContainer-7 MuiGrid-item"
              >
                <div
                  class="MuiLinearProgress-root MuiLinearProgress-colorPrimary makeStyles-progressBar-8 MuiLinearProgress-indeterminate"
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
                class="MuiGrid-root makeStyles-messageContainer-10 MuiGrid-item"
              >
                <span
                  class="MuiTypography-root makeStyles-message-11 MuiTypography-caption"
                >
                  Launching node
                </span>
              </div>
            </div>
          </div>
        </div>
      </body>
    `);
    });
    it('renders when bootstrapping', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(Index_1.Index, { bootstrapping: true, bootstrappingMessage: 'Launching node' }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-wrapper-168 makeStyles-root-166"
          >
            <div
              class="MuiGrid-root makeStyles-root-169 MuiGrid-container MuiGrid-direction-xs-column MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-justify-xs-center"
              >
                <img
                  class="makeStyles-icon-170"
                  src="test-file-stub"
                />
              </div>
              <div
                class="MuiGrid-root makeStyles-progressBarContainer-172 MuiGrid-item"
              >
                <div
                  class="MuiLinearProgress-root MuiLinearProgress-colorPrimary makeStyles-progressBar-173 MuiLinearProgress-indeterminate"
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
                class="MuiGrid-root makeStyles-messageContainer-175 MuiGrid-item"
              >
                <span
                  class="MuiTypography-root makeStyles-message-176 MuiTypography-caption"
                >
                  Launching node
                </span>
              </div>
            </div>
          </div>
        </div>
      </body>
    `);
    });
});
