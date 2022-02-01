"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const ChannelInput_1 = require("./ChannelInput");
const renderComponent_1 = require("../../../../testUtils/renderComponent");
describe('ChannelInput', () => {
    it('renders component input available ', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(ChannelInput_1.ChannelInputComponent, { channelAddress: 'channelAddress', channelName: 'channelName', inputPlaceholder: '#channel as @user', onChange: jest.fn(), onKeyPress: jest.fn(), infoClass: '', setInfoClass: jest.fn() }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root makeStyles-root-1"
          >
            <div
              class="MuiGrid-root makeStyles-root-1 MuiGrid-container MuiGrid-direction-xs-column MuiGrid-justify-xs-center"
            >
              <div
                class="MuiGrid-root makeStyles-inputsDiv-5 MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
              >
                <div
                  class="MuiGrid-root makeStyles-textfield-4 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-center MuiGrid-grid-xs-true"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                  >
                    <div
                      class="makeStyles-input-3"
                      contenteditable="true"
                      placeholder="Message #channel as @user"
                    >
                      
                    </div>
                  </div>
                  <div
                    class="MuiGrid-root makeStyles-actions-14 MuiGrid-item"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
                    >
                      <img
                        class="makeStyles-emoji-13"
                        src="test-file-stub"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="MuiGrid-root makeStyles-boot-126 MuiGrid-container"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                />
              </div>
            </div>
          </div>
        </div>
      </body>
    `);
    });
});
