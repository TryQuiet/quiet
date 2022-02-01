"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("@testing-library/jest-dom");
const react_1 = __importDefault(require("react"));
const InviteToCommunity_1 = require("../../../components/widgets/settings/InviteToCommunity");
const renderComponent_1 = require("../../../testUtils/renderComponent");
describe('InviteToCommunity', () => {
    it('renders properly', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(InviteToCommunity_1.InviteToCommunity, { communityName: 'My new community', invitationUrl: 'http://registrarurl.onion' }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column"
          >
            <div
              class="MuiGrid-root makeStyles-titleDiv-2 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-space-between"
            >
              <div
                class="MuiGrid-root makeStyles-title-1 MuiGrid-item"
              >
                <h3
                  class="MuiTypography-root MuiTypography-h3"
                >
                  Add members
                </h3>
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item"
            >
              <div
                class="MuiGrid-root MuiGrid-item"
              >
                <h5
                  class="MuiTypography-root MuiTypography-h5"
                >
                  Your invitation url
                </h5>
              </div>
              <div
                class="MuiGrid-root MuiGrid-item"
              >
                <p
                  class="MuiTypography-root MuiTypography-body2"
                >
                  Use this link to add members to 
                  <span
                    class="makeStyles-bold-5"
                  >
                    My new community
                  </span>
                </p>
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item"
            >
              <p
                class="MuiTypography-root MuiTypography-body2"
              >
                http://registrarurl.onion
              </p>
            </div>
            <div
              class="MuiGrid-root"
            >
              <button
                class="MuiButtonBase-root MuiButton-root MuiButton-text makeStyles-button-4"
                tabindex="0"
                type="button"
              >
                <span
                  class="MuiButton-label"
                >
                  Copy to clipboard
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
