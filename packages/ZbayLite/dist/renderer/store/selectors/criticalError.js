"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reselect_1 = require("reselect");
const criticalError = (s) => s.criticalError;
const message = (0, reselect_1.createSelector)(criticalError, error => error.message);
const traceback = (0, reselect_1.createSelector)(criticalError, error => error.traceback);
exports.default = {
    criticalError,
    message,
    traceback
};
