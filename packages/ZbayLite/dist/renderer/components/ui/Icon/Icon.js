"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Icon = void 0;
const react_1 = __importDefault(require("react"));
const Icon = ({ className, src, onClickHandler, onMouseEnterHandler, onMouseLeaveHandler }) => {
    return (react_1.default.createElement("img", { className: className, src: src, onClick: onClickHandler, onMouseEnter: onMouseEnterHandler, onMouseLeave: onMouseLeaveHandler }));
};
exports.Icon = Icon;
exports.default = exports.Icon;
