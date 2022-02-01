"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint import/first: 0 */
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const UsernameCreated_1 = require("./UsernameCreated");
describe('UsernameCreated', () => {
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(UsernameCreated_1.UsernameCreated, { handleClose: jest.fn(), setFormSent: jest.fn() }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-justify-xs-center"
          >
            <div
              class="MuiGrid-root makeStyles-usernameConatainer-2 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-center MuiGrid-grid-xs-12"
            >
              <img
                class="makeStyles-usernameIcon-5"
                src="test-file-stub"
              />
            </div>
            <div
              class="MuiGrid-root makeStyles-infoConatainer-3 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-center MuiGrid-grid-xs-12"
            >
              <h4
                class="MuiTypography-root MuiTypography-h4"
              >
                You created a username
              </h4>
            </div>
            <div
              class="MuiGrid-root makeStyles-buttonContainer-6 MuiGrid-item MuiGrid-grid-xs-auto"
            >
              <button
                class="MuiButtonBase-root MuiButton-root MuiButton-contained makeStyles-button-7 MuiButton-containedSizeSmall MuiButton-sizeSmall MuiButton-fullWidth"
                tabindex="0"
                type="button"
              >
                <span
                  class="MuiButton-label"
                >
                  Done
                </span>
                <span
                  class="MuiTouchRipple-root"
                />
              </button>
            </div>
          </div>
        </div>
      </body>
    `);
    });
});
