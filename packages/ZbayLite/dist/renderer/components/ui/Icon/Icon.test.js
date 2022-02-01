"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const Icon_1 = require("./Icon");
const zcash_icon_fullcolor_svg_1 = __importDefault(require("../../static/images/zcash/zcash-icon-fullcolor.svg"));
describe('Icon', () => {
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(Icon_1.Icon, { src: zcash_icon_fullcolor_svg_1.default }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <img
            src="test-file-stub"
          />
        </div>
      </body>
    `);
    });
});
