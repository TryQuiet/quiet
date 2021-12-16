"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const resultLogger = () => {
    const module = 'test';
    return Object.assign((0, debug_1.default)(`nectar:${module}`), {
        failed: (0, debug_1.default)(`nectar:${module}:failed`),
        passed: (0, debug_1.default)(`nectar:${module}:passed`),
    });
};
exports.default = resultLogger;
