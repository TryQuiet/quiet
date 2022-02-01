"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const ChannelsListItem_1 = require("./ChannelsListItem");
const contacts_1 = require("../../../store/handlers/contacts");
const renderComponent_1 = require("../../../testUtils/renderComponent");
describe('ChannelsListItem', () => {
    it('renders component public channel', () => {
        const channel = new contacts_1.Contact();
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(ChannelsListItem_1.ChannelsListItem, { channel: channel, selected: {}, directMessages: false }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            aria-disabled="false"
            class="MuiButtonBase-root MuiListItem-root makeStyles-root-1 MuiListItem-button"
            role="button"
            tabindex="0"
          >
            <div
              class="MuiListItemText-root makeStyles-itemText-8"
            >
              <span
                class="MuiTypography-root MuiListItemText-primary makeStyles-primary-3 MuiTypography-body1"
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
                      class="MuiTypography-root makeStyles-title-4 MuiTypography-body2"
                    >
                      # undefined
                    </p>
                  </div>
                </div>
              </span>
            </div>
            <span
              class="MuiTouchRipple-root"
            />
          </div>
        </div>
      </body>
    `);
    });
    it('renders component direct messages channel', () => {
        const channel = new contacts_1.Contact();
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(ChannelsListItem_1.ChannelsListItem, { channel: channel, selected: {}, directMessages: true }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            aria-disabled="false"
            class="MuiButtonBase-root MuiListItem-root makeStyles-root-172 MuiListItem-button"
            role="button"
            tabindex="0"
          >
            <div
              class="MuiListItemText-root makeStyles-itemText-179"
            >
              <span
                class="MuiTypography-root MuiListItemText-primary makeStyles-primary-174 MuiTypography-body1"
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
                      class="MuiTypography-root makeStyles-title-175 MuiTypography-body2"
                    >
                      # undefined
                    </p>
                  </div>
                </div>
              </span>
            </div>
            <span
              class="MuiTouchRipple-root"
            />
          </div>
        </div>
      </body>
    `);
    });
});
