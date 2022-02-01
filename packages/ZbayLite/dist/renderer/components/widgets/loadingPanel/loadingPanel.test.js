"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint import/first: 0 */
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const loadingPanel_1 = __importDefault(require("./loadingPanel"));
describe('CreateUsernameModal', () => {
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(loadingPanel_1.default, { handleClose: jest.fn(), open: true, message: 'message', isClosedDisabled: true }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body
        style="overflow: hidden; padding-right: 0px;"
      >
        <div
          aria-hidden="true"
        />
        <div
          class="makeStyles-root-2"
          role="presentation"
          style="position: fixed; z-index: 1300; right: 0px; bottom: 0px; top: 0px; left: 0px;"
        >
          <div
            aria-hidden="true"
            style="z-index: -1; position: fixed; right: 0px; bottom: 0px; top: 0px; left: 0px; background-color: rgba(0, 0, 0, 0.5);"
          />
          <div
            data-test="sentinelStart"
            tabindex="0"
          />
          <div
            class="MuiGrid-root makeStyles-centered-9 makeStyles-window-10 MuiGrid-container MuiGrid-direction-xs-column MuiGrid-justify-xs-center"
            tabindex="-1"
          >
            <div
              class="MuiGrid-root makeStyles-header-4 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-center MuiGrid-grid-xs-true"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                >
                  <h6
                    class="MuiTypography-root makeStyles-title-3 MuiTypography-subtitle1 MuiTypography-alignCenter"
                    style="margin-left: 36px;"
                  />
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <div
                    class="MuiGrid-root makeStyles-actions-6 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-flex-end"
                    data-testid="ModalActions"
                  />
                </div>
              </div>
            </div>
            <div
              class="MuiGrid-root makeStyles-fullPage-8 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-center"
            >
              <div
                class="MuiGrid-root makeStyles-content-7 MuiGrid-container MuiGrid-item"
                style="width: 600px;"
              >
                <div
                  class="MuiGrid-root makeStyles-spinner-1 MuiGrid-container MuiGrid-direction-xs-column MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
                >
                  <div
                    class="MuiCircularProgress-root makeStyles-spinner-146 makeStyles-spinner-147 MuiCircularProgress-indeterminate"
                    role="progressbar"
                    style="width: 40px; height: 40px;"
                  >
                    <svg
                      class="MuiCircularProgress-svg"
                      viewBox="22 22 44 44"
                    >
                      <circle
                        class="MuiCircularProgress-circle MuiCircularProgress-circleIndeterminate"
                        cx="44"
                        cy="44"
                        fill="none"
                        r="20.2"
                        stroke-width="3.6"
                      />
                    </svg>
                  </div>
                  <span
                    class="MuiTypography-root makeStyles-message-145 MuiTypography-caption MuiTypography-alignCenter"
                    style="font-size: 0.9090909090909091rem;"
                  >
                    message
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div
            data-test="sentinelEnd"
            tabindex="0"
          />
        </div>
      </body>
    `);
    });
});
