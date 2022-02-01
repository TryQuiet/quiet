"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reselect_1 = require("reselect");
const waggle = (s) => s.waggle;
const isConnected = (0, reselect_1.createSelector)(waggle, w => w.isWaggleConnected);
exports.default = {
    isConnected
};
