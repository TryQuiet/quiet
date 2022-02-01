"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const BlockedUsers_1 = require("./BlockedUsers");
describe('BlockedUsers', () => {
    it('renders component', () => {
        const props = {
            unblock: jest.fn(),
            users: [],
            blockedUsers: []
        };
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(BlockedUsers_1.BlockedUsers, Object.assign({}, props)));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column"
          >
            <div
              class="MuiGrid-root makeStyles-titleDiv-2 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-space-between"
            >
              <div
                class="MuiGrid-root makeStyles-title-1 MuiGrid-item"
              >
                <h3
                  class="MuiTypography-root MuiTypography-h3"
                >
                  BlockedUsers
                </h3>
              </div>
            </div>
          </div>
        </div>
      </body>
    `);
    });
});
