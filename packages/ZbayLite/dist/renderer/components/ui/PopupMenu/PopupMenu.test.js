"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const PopupMenu_1 = require("./PopupMenu");
describe('PopupMenu', () => {
    it('renders component', () => {
        const Content = () => react_1.default.createElement("div", null, "Content");
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(PopupMenu_1.PopupMenu, { open: true },
            react_1.default.createElement(Content, null)));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-popper-6"
            role="tooltip"
            style="position: fixed; top: 0px; left: 0px;"
          >
            <div
              class="makeStyles-wrapper-1"
              style="opacity: 1; transform: scale(1, 1); transform-origin: center bottom; transition: opacity 0ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,transform 0ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;"
            >
              <div
                class="MuiPaper-root MuiPaper-elevation1 makeStyles-paper-2 MuiPaper-rounded"
              >
                <div>
                  Content
                </div>
              </div>
              <span
                class="makeStyles-bottom-4"
              />
            </div>
          </div>
        </div>
      </body>
    `);
    });
    it('renders when closed', () => {
        const Content = () => react_1.default.createElement("div", null, "Content");
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(PopupMenu_1.PopupMenu, { open: false },
            react_1.default.createElement(Content, null)));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div />
      </body>
    `);
    });
    it('renders with offset', () => {
        const Content = () => react_1.default.createElement("div", null, "Content");
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(PopupMenu_1.PopupMenu, { open: true, offset: '0 10' },
            react_1.default.createElement(Content, null)));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-popper-45"
            role="tooltip"
            style="position: fixed; top: 0px; left: 0px;"
          >
            <div
              class="makeStyles-wrapper-40"
              style="opacity: 1; transform: scale(1, 1); transform-origin: center bottom; transition: opacity 0ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,transform 0ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;"
            >
              <div
                class="MuiPaper-root MuiPaper-elevation1 makeStyles-paper-41 MuiPaper-rounded"
              >
                <div>
                  Content
                </div>
              </div>
              <span
                class="makeStyles-bottom-43"
              />
            </div>
          </div>
        </div>
      </body>
    `);
    });
});
