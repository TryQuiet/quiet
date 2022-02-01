"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const theme_1 = __importDefault(require("../../../theme"));
const styles_1 = require("@material-ui/core/styles");
const WelcomeMessage_1 = require("./WelcomeMessage");
const renderComponent_1 = require("../../../testUtils/renderComponent");
describe('WelcomeMessage', () => {
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(styles_1.MuiThemeProvider, { theme: theme_1.default },
            react_1.default.createElement(WelcomeMessage_1.WelcomeMessage, { message: 'random message', timestamp: 'string' })));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <li
            class="MuiListItem-root-9 makeStyles-wrapper-2 MuiListItem-gutters-16"
          >
            <div
              class="MuiListItemText-root-20 makeStyles-messageCard-1 MuiListItemText-multiline-21"
            >
              <div
                class="MuiGrid-root-26 MuiGrid-container-27 MuiGrid-wrap-xs-nowrap-33 MuiGrid-align-items-xs-flex-start-36"
              >
                <div
                  class="MuiGrid-root-26 makeStyles-avatar-4 MuiGrid-item-28"
                >
                  <img
                    class="makeStyles-icon-7"
                    src="test-file-stub"
                  />
                </div>
                <div
                  class="MuiGrid-root-26 MuiGrid-container-27 MuiGrid-item-28 MuiGrid-justify-xs-space-between-46"
                >
                  <div
                    class="MuiGrid-root-26 MuiGrid-container-27 MuiGrid-item-28 MuiGrid-wrap-xs-nowrap-33 MuiGrid-align-items-xs-flex-start-36 MuiGrid-grid-xs-true-60"
                  >
                    <div
                      class="MuiGrid-root-26 MuiGrid-item-28"
                    >
                      <p
                        class="MuiTypography-root-129 makeStyles-username-3 MuiTypography-body1-131 MuiTypography-colorTextPrimary-154"
                      >
                        Zbay
                      </p>
                    </div>
                    <div
                      class="MuiGrid-root-26 MuiGrid-item-28"
                    >
                      <p
                        class="MuiTypography-root-129 makeStyles-time-8 MuiTypography-body1-131"
                      >
                        string
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="MuiGrid-root-26 makeStyles-messageInput-6 MuiGrid-item-28"
              >
                <p
                  class="MuiTypography-root-129 makeStyles-message-5 MuiTypography-body2-130"
                >
                  random message
                </p>
              </div>
            </div>
          </li>
        </div>
      </body>
    `);
    });
});
