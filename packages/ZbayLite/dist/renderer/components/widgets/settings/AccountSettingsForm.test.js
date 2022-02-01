"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint import/first: 0 */
const react_1 = __importDefault(require("react"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const AccountSettingsForm_1 = require("./AccountSettingsForm");
describe('AccountSettingsForm', () => {
    it('renders component', () => {
        const user = {
            id: '',
            hiddenService: { onionAddress: '', privateKey: '' },
            peerId: {
                id: '',
                pubKey: '',
                privKey: ''
            },
            dmKeys: {
                publicKey: '',
                privateKey: ''
            },
            zbayNickname: '',
            userCsr: undefined,
            userCertificate: ''
        };
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(AccountSettingsForm_1.AccountSettingsForm, { user: user }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column"
          >
            <div
              class="MuiGrid-root makeStyles-title-8 MuiGrid-item"
            >
              <h3
                class="MuiTypography-root MuiTypography-h3"
              >
                Account
              </h3>
            </div>
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-justify-xs-center"
            >
              <div
                class="MuiGrid-root makeStyles-createUsernameContainer-1 MuiGrid-container MuiGrid-item MuiGrid-grid-xs-true"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12"
                >
                  <h4
                    class="MuiTypography-root MuiTypography-h4"
                  >
                    @
                    
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    `);
    });
});
