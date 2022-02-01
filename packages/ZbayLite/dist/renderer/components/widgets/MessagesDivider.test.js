"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint import/first: 0 */
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../testUtils/renderComponent");
const MessagesDivider_1 = require("./MessagesDivider");
describe('MessagesDivider', () => {
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(MessagesDivider_1.MessagesDivider, { title: 'test' }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
          >
            <div
              class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
            >
              <div
                class="makeStyles-divider-2"
              />
            </div>
            <div
              class="MuiGrid-root makeStyles-titleDiv-3 MuiGrid-item"
            >
              <p
                class="MuiTypography-root MuiTypography-body1"
              >
                test
              </p>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
            >
              <div
                class="makeStyles-divider-2"
              />
            </div>
          </div>
        </div>
      </body>
    `);
    });
});
