"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reselect_1 = require("reselect");
const app = (s) => s.app;
const version = (0, reselect_1.createSelector)(app, (a) => a.version);
const currentModalTab = (0, reselect_1.createSelector)(app, (a) => a.modalTabToOpen);
const isInitialLoadFinished = (0, reselect_1.createSelector)(app, (a) => a.isInitialLoadFinished);
exports.default = {
    version,
    currentModalTab,
    isInitialLoadFinished
};
