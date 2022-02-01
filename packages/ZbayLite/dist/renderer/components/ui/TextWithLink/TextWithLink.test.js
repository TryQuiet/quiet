"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const TextWithLink_1 = require("./TextWithLink");
describe('TextWithLink', () => {
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(TextWithLink_1.TextWithLink, { text: 'Here is simple text', links: [
                {
                    tag: 'simple',
                    label: 'simple',
                    action: () => {
                        console.log('linked clicked');
                    }
                }
            ] }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <p
            class="MuiTypography-root MuiTypography-body1"
          >
            <span>
              Here
            </span>
            <span>
               
            </span>
            <span>
              is
            </span>
            <span>
               
            </span>
            <span>
              simple
            </span>
            <span>
               
            </span>
            <span>
              text
            </span>
          </p>
        </div>
      </body>
    `);
    });
});
