"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const BaseChannelsList_1 = require("./BaseChannelsList");
const renderComponent_1 = require("../../../testUtils/renderComponent");
describe('BaseChannelsList', () => {
    it('renders component', () => {
        const channels = [
            {
                name: 'name',
                description: '',
                owner: 'alice',
                timestamp: 1243545,
                address: 'name'
            }
        ];
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(BaseChannelsList_1.BaseChannelsList, { channels: channels }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <ul
            class="MuiList-root"
          >
            <div
              aria-disabled="false"
              class="MuiButtonBase-root MuiListItem-root makeStyles-root-5 MuiListItem-button"
              data-testid="name-link"
              role="button"
              tabindex="0"
            >
              <div
                class="MuiListItemText-root makeStyles-itemText-12"
              >
                <span
                  class="MuiTypography-root MuiListItemText-primary makeStyles-primary-7 MuiTypography-body1"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    />
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    >
                      <p
                        class="MuiTypography-root makeStyles-title-8 MuiTypography-body2"
                      >
                        # name
                      </p>
                    </div>
                  </div>
                </span>
              </div>
              <span
                class="MuiTouchRipple-root"
              />
            </div>
          </ul>
        </div>
      </body>
    `);
    });
});
