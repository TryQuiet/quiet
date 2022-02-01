"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const ChannelHeader_1 = require("./ChannelHeader");
describe('ChannelHeader', () => {
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(ChannelHeader_1.ChannelHeaderComponent, { channel: {
                name: 'general',
                description: 'description',
                owner: 'alice',
                timestamp: 0,
                address: 'address'
            }, onInfo: jest.fn(), onDelete: jest.fn(), onSettings: jest.fn(), mutedFlag: false, notificationFilter: '', openNotificationsTab: jest.fn() }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-wrapper-12"
          >
            <div
              class="MuiGrid-root makeStyles-root-1 MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-space-between"
            >
              <div
                class="MuiGrid-root MuiGrid-item"
              >
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item"
                  >
                    <h6
                      class="MuiTypography-root makeStyles-title-2 makeStyles-bold-15 MuiTypography-subtitle1 MuiTypography-noWrap"
                      data-testid="channelTitle"
                      style="max-width: 724px;"
                    >
                      #general
                    </h6>
                  </div>
                </div>
              </div>
              <div
                class="MuiGrid-root makeStyles-actions-5 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-align-content-xs-center MuiGrid-justify-xs-flex-end MuiGrid-grid-xs-true"
              >
                <div
                  class="MuiGrid-root MuiGrid-item"
                />
              </div>
            </div>
          </div>
        </div>
      </body>
    `);
    });
});
