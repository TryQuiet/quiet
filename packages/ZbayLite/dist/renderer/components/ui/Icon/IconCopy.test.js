"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const IconCopy_1 = require("./IconCopy");
describe('IconCopy', () => {
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(IconCopy_1.IconCopy, null));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div>
            <div
              class="makeStyles-squareTop-3"
            >
              <div
                class="makeStyles-gradient-4"
              >
                <div
                  class="makeStyles-squareFill-5"
                />
              </div>
            </div>
            <div
              class="makeStyles-squareBottom-6"
            >
              <div
                class="makeStyles-gradient-4"
              >
                <div
                  class="makeStyles-squareFill-5"
                />
              </div>
            </div>
          </div>
        </div>
      </body>
    `);
    });
});
