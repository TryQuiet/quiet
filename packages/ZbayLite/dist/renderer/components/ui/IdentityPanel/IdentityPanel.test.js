"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const nectar_1 = require("@zbayapp/nectar");
const IdentityPanel_1 = require("./IdentityPanel");
const prepareStore_1 = require("../../../testUtils/prepareStore");
const renderComponent_1 = require("../../../testUtils/renderComponent");
describe('IdentityPanel', () => {
    it('renders component with username', () => __awaiter(void 0, void 0, void 0, function* () {
        const { store } = yield (0, prepareStore_1.prepareStore)();
        const factory = yield (0, nectar_1.getFactory)(store);
        const community = yield factory.create('Community');
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(IdentityPanel_1.IdentityPanel, { community: community, handleSettings: jest.fn() }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-root-1"
          >
            <span
              aria-disabled="false"
              class="MuiButtonBase-root MuiButton-root makeStyles-button-2 MuiButton-text"
              role="button"
              tabindex="0"
            >
              <span
                class="MuiButton-label makeStyles-buttonLabel-3"
              >
                <h4
                  class="MuiTypography-root makeStyles-nickname-4 MuiTypography-h4"
                >
                  community_1
                </h4>
                <svg
                  aria-hidden="true"
                  class="MuiSvgIcon-root MuiSvgIcon-fontSizeSmall"
                  focusable="false"
                  role="presentation"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"
                  />
                </svg>
              </span>
              <span
                class="MuiTouchRipple-root"
              />
            </span>
          </div>
        </div>
      </body>
    `);
    }));
});
