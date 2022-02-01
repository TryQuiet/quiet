"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const SliderThumb_1 = require("./SliderThumb");
describe('SliderThumb', () => {
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(SliderThumb_1.SliderThumb, null));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-root-1"
          />
        </div>
      </body>
    `);
    });
});
