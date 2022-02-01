"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const UserListItem_1 = require("./UserListItem");
describe('UserListItem', () => {
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(UserListItem_1.UserListItem, { name: 'testname', action: () => { }, disableConfirmation: true, actionName: 'testactionname' }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root makeStyles-root-1 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-space-between MuiGrid-grid-xs-true"
          >
            <div
              class="MuiGrid-root MuiGrid-item"
            >
              <h6
                class="MuiTypography-root makeStyles-name-2 MuiTypography-subtitle1"
              >
                @
                testname
              </h6>
            </div>
            <div
              class="MuiGrid-root makeStyles-pointer-4 MuiGrid-item"
            >
              <p
                class="MuiTypography-root makeStyles-actionName-3 MuiTypography-body2"
              >
                testactionname
              </p>
            </div>
          </div>
        </div>
      </body>
    `);
    });
});
