"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTheme = exports.withStore = void 0;
const react_1 = __importDefault(require("react"));
const react_redux_1 = require("react-redux");
const core_1 = require("@material-ui/core");
const theme_1 = __importDefault(require("../theme"));
const withStore = store => Story => (react_1.default.createElement(react_redux_1.Provider, { store: store },
    react_1.default.createElement(Story, null)));
exports.withStore = withStore;
const withTheme = Story => (react_1.default.createElement(core_1.ThemeProvider, { theme: theme_1.default },
    react_1.default.createElement(Story, null)));
exports.withTheme = withTheme;
