"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const SendMessagePopover_1 = require("./SendMessagePopover");
const renderComponent_1 = require("../../../testUtils/renderComponent");
describe('SendMessagePopover', () => {
    it('renders popover', () => {
        const ref = react_1.default.createRef();
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(SendMessagePopover_1.SendMessagePopover, { anchorEl: ref.current, handleClose: jest.fn(), username: 'TestUser', users: {}, address: 'ztestsapling1juf4322spfp2nhmqaz5wymw8nkkxxyv06x38cel2nj6d7s8fdyd6dlsmc6efv02sf0kty2v7lfz' }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div />
      </body>
    `);
    });
});
