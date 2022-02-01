"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const ChannelMenuAction_1 = require("./ChannelMenuAction");
describe('ChannelMenuAction', () => {
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(ChannelMenuAction_1.ChannelMenuActionComponent, { onInfo: jest.fn(), onMute: jest.fn(), onDelete: jest.fn(), onUnmute: jest.fn(), onSettings: jest.fn(), openNotificationsTab: jest.fn(), mutedFlag: true, disableSettings: true, notificationFilter: '1' }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <button
            class="MuiButtonBase-root MuiIconButton-root makeStyles-button-6"
            tabindex="0"
            type="button"
          >
            <span
              class="MuiIconButton-label"
            >
              <img
                class="makeStyles-icon-5"
                src="test-file-stub"
              />
            </span>
          </button>
        </div>
      </body>
    `);
    });
});
