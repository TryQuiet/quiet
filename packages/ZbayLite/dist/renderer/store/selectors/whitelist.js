"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reselect_1 = require("reselect");
const whitelist = (s) => s.whitelist;
const whitelisted = (0, reselect_1.createSelector)(whitelist, a => a.whitelisted);
const allowAll = (0, reselect_1.createSelector)(whitelist, a => a.allowAll);
const autoload = (0, reselect_1.createSelector)(whitelist, a => a.autoload);
exports.default = {
    whitelist,
    whitelisted,
    allowAll,
    autoload
};
