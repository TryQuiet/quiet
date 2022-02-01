"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reselect_1 = require("reselect");
const notifications = (s) => s.notifications;
const data = (0, reselect_1.createSelector)(notifications, s => s);
exports.default = {
    data
};
