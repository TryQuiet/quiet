"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const PageHeader_1 = require("./PageHeader");
describe('PageHeader', () => {
    const Content = () => react_1.default.createElement("div", null, "Test Header");
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(PageHeader_1.PageHeader, null,
            react_1.default.createElement(Content, null)));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root makeStyles-root-1 MuiGrid-item"
          >
            <div>
              Test Header
            </div>
          </div>
        </div>
      </body>
    `);
    });
});
