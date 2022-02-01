"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const jest_each_1 = __importDefault(require("jest-each"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const SnackbarContent_1 = require("./SnackbarContent");
describe('SnackbarContent', () => {
    (0, jest_each_1.default)(['success', 'warning', 'error', 'info', 'loading']).test('renders %s', variant => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(SnackbarContent_1.SnackbarContent, { message: 'test snackbar', variant: variant, onClose: jest.fn() }));
        expect(result.baseElement).toMatchSnapshot();
    });
    it('renders fullWidth', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(SnackbarContent_1.SnackbarContent, { message: 'test snackbar', variant: 'success', onClose: jest.fn(), fullWidth: true }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiTypography-root MuiPaper-root MuiPaper-elevation6 MuiSnackbarContent-root makeStyles-success-493 makeStyles-fullWidth-499 MuiTypography-body2"
            role="alert"
          >
            <div
              class="MuiSnackbarContent-message"
            >
              <span
                class="makeStyles-content-501"
              >
                <svg
                  aria-hidden="true"
                  class="MuiSvgIcon-root makeStyles-icon-500"
                  focusable="false"
                  role="presentation"
                  size="20"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                  />
                </svg>
                <span
                  class="makeStyles-message-502"
                >
                  test snackbar
                </span>
              </span>
            </div>
            <div
              class="MuiSnackbarContent-action"
            >
              <button
                class="MuiButtonBase-root MuiIconButton-root makeStyles-close-492 MuiIconButton-colorInherit"
                tabindex="0"
                type="button"
              >
                <span
                  class="MuiIconButton-label"
                >
                  <svg
                    aria-hidden="true"
                    class="MuiSvgIcon-root makeStyles-icon-500"
                    focusable="false"
                    role="presentation"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                    />
                  </svg>
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
