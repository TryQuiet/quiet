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
const ChannelRegisteredMessage_1 = require("./ChannelRegisteredMessage");
const renderComponent_1 = require("../../../testUtils/renderComponent");
const react_router_dom_1 = require("react-router-dom");
const react_redux_1 = require("react-redux");
const store_1 = __importDefault(require("../../../store"));
describe('ChannelRegisteredMessage', () => __awaiter(void 0, void 0, void 0, function* () {
    it('renders component', () => __awaiter(void 0, void 0, void 0, function* () {
        const message = {
            id: 'string',
            type: 1,
            message: 'string',
            createdAt: 0,
            date: 'string',
            nickname: 'string'
        };
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_router_dom_1.HashRouter, null,
            react_1.default.createElement(react_redux_1.Provider, { store: store_1.default },
                react_1.default.createElement(ChannelRegisteredMessage_1.ChannelRegisteredMessage, { username: 'testUsername', onChannelClick: () => { }, message: message }))));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <li
            class="MuiListItem-root makeStyles-wrapper-4 MuiListItem-gutters"
          >
            <div
              class="MuiListItemText-root makeStyles-messageCard-3 MuiListItemText-multiline"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap MuiGrid-align-items-xs-flex-start"
              >
                <div
                  class="MuiGrid-root makeStyles-avatar-6 MuiGrid-item"
                >
                  <img
                    class="makeStyles-icon-9"
                    src="test-file-stub"
                  />
                </div>
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
                        class="MuiTypography-root makeStyles-username-5 MuiTypography-body1 MuiTypography-colorTextPrimary"
                      >
                        Zbay
                      </p>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    >
                      <p
                        class="MuiTypography-root makeStyles-time-10 MuiTypography-body1"
                      >
                        0
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="MuiGrid-root makeStyles-messageInput-8 MuiGrid-item"
              >
                <p
                  class="MuiTypography-root makeStyles-message-7 MuiTypography-body2"
                >
                  <span
                    class="makeStyles-nickname-1"
                  >
                    testUsername
                  </span>
                  <span>
                     
                    just published
                     
                    <span
                      class="makeStyles-link-2"
                    >
                      #
                      string
                    </span>
                     
                    on zbay!
                  </span>
                </p>
              </div>
            </div>
          </li>
        </div>
      </body>
    `);
    }));
}));
