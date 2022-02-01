"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const MenuAction_1 = require("./MenuAction");
const MenuActionItem_1 = __importDefault(require("./MenuActionItem"));
describe('MenuAction', () => {
    it('renders component', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(MenuAction_1.MenuAction, { icon: 'icon', iconHover: 'iconHover', offset: '0 20' },
            react_1.default.createElement(MenuActionItem_1.default, { onClick: jest.fn(), title: 'test 1' }),
            react_1.default.createElement(MenuActionItem_1.default, { onClick: jest.fn(), title: 'test 2' })));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <button
            class="MuiButtonBase-root MuiIconButton-root makeStyles-button-3"
            tabindex="0"
            type="button"
          >
            <span
              class="MuiIconButton-label"
            >
              <img
                class="makeStyles-icon-2"
                src="icon"
              />
            </span>
          </button>
        </div>
      </body>
    `);
    });
});
