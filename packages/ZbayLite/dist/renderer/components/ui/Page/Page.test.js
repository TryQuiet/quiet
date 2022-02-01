"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const Page_1 = require("./Page");
const PageHeader_1 = __importDefault(require("./PageHeader"));
describe('Page', () => {
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(Page_1.Page, null,
            react_1.default.createElement(PageHeader_1.default, null,
                react_1.default.createElement("div", null, "Test header")),
            react_1.default.createElement("div", null, "Test header")));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column"
            style="height: 100vh;"
          >
            <div
              class="MuiGrid-root makeStyles-root-104 MuiGrid-item"
            >
              <div>
                Test header
              </div>
            </div>
            <div>
              Test header
            </div>
          </div>
        </div>
      </body>
    `);
    });
});
