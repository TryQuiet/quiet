"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const jest_each_1 = __importDefault(require("jest-each"));
const Elipsis_1 = require("./Elipsis");
const renderComponent_1 = require("../../../testUtils/renderComponent");
describe('Elipsis', () => {
    (0, jest_each_1.default)(['bottom-start', 'bottom', 'bottom-end']).test('renders with placement %s', placement => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(Elipsis_1.Elipsis, { content: 'this is a sample text', length: 5, tooltipPlacement: placement }));
        expect(result.baseElement).toMatchSnapshot();
    });
    it('renders with custom size', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(Elipsis_1.Elipsis, { content: 'this is a sample text', length: 5 }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span>
            <span
              class="MuiTypography-root makeStyles-content-142 MuiTypography-caption"
            >
              this ...
            </span>
          </span>
        </div>
      </body>
    `);
    });
    it('disables if shorter than limit', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(Elipsis_1.Elipsis, { content: 'this is a sample text', length: 50 }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span>
            <span
              class="MuiTypography-root makeStyles-content-189 MuiTypography-caption"
            >
              this is a sample text
            </span>
          </span>
        </div>
      </body>
    `);
    });
});
