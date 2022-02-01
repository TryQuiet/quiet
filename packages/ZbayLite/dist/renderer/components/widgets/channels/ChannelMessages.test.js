"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const luxon_1 = require("luxon");
const ChannelMessages_1 = require("./ChannelMessages");
describe('ChannelMessages', () => {
    it('renders component', () => __awaiter(void 0, void 0, void 0, function* () {
        const message = {
            id: 'string',
            type: 1,
            message: 'string',
            createdAt: 1636995488.44,
            date: 'string',
            nickname: 'string'
        };
        jest.spyOn(luxon_1.DateTime, 'utc').mockImplementationOnce(() => luxon_1.DateTime.utc(2019, 3, 7, 13, 3, 48));
        const messages = {
            count: 1,
            groups: {
                Today: [[message]]
            }
        };
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(ChannelMessages_1.ChannelMessagesComponent, { channel: 'general', messages: messages }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-scroll-1"
          >
            <ul
              class="MuiList-root makeStyles-list-2"
              id="messages-scroll"
            >
              <div>
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                  >
                    <div
                      class="makeStyles-divider-13"
                    />
                  </div>
                  <div
                    class="MuiGrid-root makeStyles-titleDiv-14 MuiGrid-item"
                  >
                    <p
                      class="MuiTypography-root MuiTypography-body1"
                    >
                      Today
                    </p>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                  >
                    <div
                      class="makeStyles-divider-13"
                    />
                  </div>
                </div>
                <li
                  class="MuiListItem-root makeStyles-wrapper-149 makeStyles-wrapperPending-151 MuiListItem-gutters"
                >
                  <div
                    class="MuiListItemText-root makeStyles-messageCard-148"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap MuiGrid-align-items-xs-flex-start"
                    >
                      <div
                        class="MuiGrid-root makeStyles-avatar-156 MuiGrid-item"
                      >
                        <div
                          class="makeStyles-alignAvatar-157"
                        >
                          Jdenticon
                        </div>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-container MuiGrid-item"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-justify-xs-space-between"
                        >
                          <div
                            class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-wrap-xs-nowrap MuiGrid-align-items-xs-flex-start MuiGrid-grid-xs-true"
                          >
                            <div
                              class="MuiGrid-root MuiGrid-item"
                            >
                              <p
                                class="MuiTypography-root makeStyles-username-152 MuiTypography-body1 MuiTypography-colorTextPrimary"
                              >
                                string
                              </p>
                            </div>
                            <div
                              class="MuiGrid-root MuiGrid-item"
                            >
                              <p
                                class="MuiTypography-root makeStyles-time-159 MuiTypography-body1"
                              >
                                string
                              </p>
                            </div>
                          </div>
                        </div>
                        <div
                          class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column"
                        >
                          <div
                            class="MuiGrid-root makeStyles-firstMessage-179 MuiGrid-item"
                          >
                            <p
                              class="MuiTypography-root makeStyles-message-178 MuiTypography-body1"
                              data-testid="messagesGroupContent-string"
                            >
                              string
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </div>
            </ul>
          </div>
        </div>
      </body>
    `);
    }));
});
