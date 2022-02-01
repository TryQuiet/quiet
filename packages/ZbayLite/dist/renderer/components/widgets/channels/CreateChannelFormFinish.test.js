"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const CreateChannelFormFinish_1 = require("./CreateChannelFormFinish");
const renderComponent_1 = require("../../../testUtils/renderComponent");
describe('CreateChannelFormFinish', () => {
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(CreateChannelFormFinish_1.CreateChannelFormFinish, null));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
          >
            <div
              class="MuiGrid-root MuiGrid-item"
            >
              <h3
                class="MuiTypography-root MuiTypography-h3"
              >
                Creating Channel
              </h3>
            </div>
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
            >
              <div
                class="MuiLinearProgress-root makeStyles-rootBar-1 MuiLinearProgress-colorPrimary MuiLinearProgress-indeterminate"
                role="progressbar"
              >
                <div
                  class="MuiLinearProgress-bar MuiLinearProgress-barColorPrimary makeStyles-progressBar-2 MuiLinearProgress-bar1Indeterminate"
                />
                <div
                  class="MuiLinearProgress-bar MuiLinearProgress-bar2Indeterminate MuiLinearProgress-barColorPrimary makeStyles-progressBar-2"
                />
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item"
            >
              <p
                class="MuiTypography-root makeStyles-info-3 MuiTypography-body1"
              >
                Generating keys
              </p>
            </div>
          </div>
        </div>
      </body>
    `);
    });
});
