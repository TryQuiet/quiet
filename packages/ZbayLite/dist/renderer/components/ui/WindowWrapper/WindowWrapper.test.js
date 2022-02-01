"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const WindowWrapper_1 = require("./WindowWrapper");
describe('WindowWrapper', () => {
    const Page = () => react_1.default.createElement("div", null, "Test page");
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(WindowWrapper_1.WindowWrapper, null,
            react_1.default.createElement(Page, null)));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-wrapper-2"
          >
            <div>
              Test page
            </div>
          </div>
        </div>
      </body>
    `);
    });
    it('renders with custom className', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(WindowWrapper_1.WindowWrapper, { className: 'test-class' },
            react_1.default.createElement(Page, null)));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-wrapper-4 test-class"
          >
            <div>
              Test page
            </div>
          </div>
        </div>
      </body>
    `);
    });
});
