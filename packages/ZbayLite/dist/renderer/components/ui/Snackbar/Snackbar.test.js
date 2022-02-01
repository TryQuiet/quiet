"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const jest_each_1 = __importDefault(require("jest-each"));
const renderComponent_1 = require("../../../testUtils/renderComponent");
const Snackbar_1 = require("./Snackbar");
describe('Snackbar', () => {
    (0, jest_each_1.default)(['success', 'warning', 'error', 'info', 'loading']).test('renders %s', variant => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(Snackbar_1.Snackbar, { open: true, message: 'test snackbar', variant: variant, onClose: jest.fn() }));
        expect(result.baseElement).toMatchSnapshot();
    });
    (0, jest_each_1.default)([
        ['top', 'left'],
        ['top', 'right'],
        ['bottom', 'left'],
        ['top', 'right']
    ]).test('renders full width for position [%s, %s]', (vertical, horizontal) => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(Snackbar_1.Snackbar, { open: true, message: 'test snackbar', variant: 'success', position: { vertical, horizontal }, fullWidth: true, onClose: jest.fn() }));
        expect(result.baseElement).toMatchSnapshot();
    });
    it('renders closed', () => {
        const result = (0, renderComponent_1.renderComponent)(react_1.default.createElement(Snackbar_1.Snackbar, { open: false, message: 'test snackbar', variant: 'success', onClose: jest.fn() }));
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div />
      </body>
    `);
    });
});
