"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const jest_each_1 = __importDefault(require("jest-each"));
const PulseDot_1 = require("./PulseDot");
const renderComponent_1 = require("../../../testUtils/renderComponent");
describe('PulseDot', () => {
    (0, jest_each_1.default)(['healthy', 'syncing', 'restarting', 'down']).test('renders for status %s', status => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(PulseDot_1.PulseDot, { color: status }));
        expect(result.baseElement).toMatchSnapshot();
    });
    it('renders with custom size', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(PulseDot_1.PulseDot, { color: 'healthy', size: 32 }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-root-30 makeStyles-healthy-31"
            style="width: 32px; height: 32px;"
          />
        </div>
      </body>
    `);
    });
    it('renders with custom className', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(PulseDot_1.PulseDot, { color: 'healthy', className: 'custom-class-name' }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-root-37 makeStyles-healthy-38 custom-class-name"
            style="width: 16px; height: 16px;"
          />
        </div>
      </body>
    `);
    });
});
