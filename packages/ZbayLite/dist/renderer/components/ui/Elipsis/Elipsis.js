"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Elipsis = void 0;
const react_1 = __importDefault(require("react"));
const R = __importStar(require("ramda"));
const core_1 = require("@material-ui/core");
const Tooltip_1 = __importDefault(require("../Tooltip/Tooltip"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const useStyles = (0, core_1.makeStyles)({
    content: {}
});
const Elipsis = ({ content, length = 40, tooltipPlacement = 'bottom-start', interactive = false }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(Tooltip_1.default, { title: content, interactive: interactive, placement: tooltipPlacement, disableHoverListener: content.length < length },
        react_1.default.createElement(Typography_1.default, { variant: 'caption', className: classes.content }, R.concat(content.substring(0, length), content.length > length ? '...' : ''))));
};
exports.Elipsis = Elipsis;
exports.default = exports.Elipsis;
