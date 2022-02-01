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
const luxon_1 = require("luxon");
const BasicMessage_1 = require("./BasicMessage");
const renderComponent_1 = require("../../../testUtils/renderComponent");
const react_router_dom_1 = require("react-router-dom");
const react_redux_1 = require("react-redux");
const store_1 = __importDefault(require("../../../store"));
describe('BasicMessage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(luxon_1.DateTime, 'utc').mockImplementationOnce(() => luxon_1.DateTime.utc(2019, 3, 7, 13, 3, 48));
    });
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
                react_1.default.createElement(BasicMessage_1.BasicMessageComponent, { messages: [message] }))));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <li
            class="MuiListItem-root makeStyles-wrapper-2 makeStyles-wrapperPending-4 MuiListItem-gutters"
          >
            <div
              class="MuiListItemText-root makeStyles-messageCard-1"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap MuiGrid-align-items-xs-flex-start"
              >
                <div
                  class="MuiGrid-root makeStyles-avatar-9 MuiGrid-item"
                >
                  <div
                    class="makeStyles-alignAvatar-10"
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
                          class="MuiTypography-root makeStyles-username-5 MuiTypography-body1 MuiTypography-colorTextPrimary"
                        >
                          string
                        </p>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-item"
                      >
                        <p
                          class="MuiTypography-root makeStyles-time-12 MuiTypography-body1"
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
                      class="MuiGrid-root makeStyles-firstMessage-165 MuiGrid-item"
                    >
                      <p
                        class="MuiTypography-root makeStyles-message-164 MuiTypography-body1"
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
      </body>
    `);
    }));
});
