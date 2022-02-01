"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Page = void 0;
const react_1 = __importDefault(require("react"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const Page = ({ children }) => (react_1.default.createElement(Grid_1.default, { container: true, direction: 'column', style: { height: '100vh' } }, children));
exports.Page = Page;
exports.default = exports.Page;
