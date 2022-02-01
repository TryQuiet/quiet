"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Index = void 0;
const react_1 = __importDefault(require("react"));
const styles_1 = require("@material-ui/core/styles");
const WindowWrapper_1 = __importDefault(require("../ui/WindowWrapper/WindowWrapper"));
const Loading_1 = __importDefault(require("./Loading"));
const useStyles = (0, styles_1.makeStyles)(() => ({
    root: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        WebkitAppRegion: process.platform === 'win32' ? 'no-drag' : 'drag'
    }
}));
const Index = ({ bootstrapping = false, bootstrappingMessage = '' }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(WindowWrapper_1.default, { className: classes.root },
        react_1.default.createElement(Loading_1.default, { message: bootstrapping ? bootstrappingMessage : 'Waiting for Zcash node...' })));
};
exports.Index = Index;
exports.default = exports.Index;
