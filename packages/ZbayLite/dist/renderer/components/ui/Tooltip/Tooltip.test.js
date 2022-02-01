"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const jest_each_1 = __importDefault(require("jest-each"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const Tooltip_1 = require("./Tooltip");
describe('Tooltip', () => {
    const TooltipContent = () => react_1.default.createElement("div", null, "TooltipContent");
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(Tooltip_1.Tooltip, { title: 'test-title' },
            react_1.default.createElement(TooltipContent, null)));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span>
            <div>
              TooltipContent
            </div>
          </span>
        </div>
      </body>
    `);
    });
    it('renders component with optional props', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(Tooltip_1.Tooltip, { title: 'test-title', interactive: true, noWrap: true },
            react_1.default.createElement(TooltipContent, null)));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span>
            <div>
              TooltipContent
            </div>
          </span>
        </div>
      </body>
    `);
    });
    (0, jest_each_1.default)(['bottom-start', 'bottom', 'bottom-end', 'top-start', 'top', 'top-end']).test('renders component with correct arrow placement - %s', placement => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(Tooltip_1.Tooltip, { title: 'test-title', placement: placement },
            react_1.default.createElement(TooltipContent, null)));
        expect(result.baseElement).toMatchSnapshot();
    });
});
