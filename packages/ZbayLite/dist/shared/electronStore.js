"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrationStore = void 0;
const electron_store_webpack_wrapper_1 = __importDefault(require("electron-store-webpack-wrapper"));
exports.migrationStore = (0, electron_store_webpack_wrapper_1.default)({ name: 'migration' });
exports.default = (0, electron_store_webpack_wrapper_1.default)();
