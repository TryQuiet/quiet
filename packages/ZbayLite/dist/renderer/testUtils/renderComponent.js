"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderComponent = void 0;
const react_1 = __importDefault(require("react"));
const core_1 = require("@material-ui/core");
const react_redux_1 = require("react-redux");
const react_2 = require("@testing-library/react");
const theme_1 = __importDefault(require("../theme"));
const store_1 = __importDefault(require("../store"));
const renderComponent = (ui, storeState = store_1.default) => {
    const Wrapper = ({ children }) => (react_1.default.createElement(core_1.MuiThemeProvider, { theme: theme_1.default },
        react_1.default.createElement(react_redux_1.Provider, { store: storeState }, children)));
    return (0, react_2.render)(ui, { wrapper: Wrapper });
};
exports.renderComponent = renderComponent;
