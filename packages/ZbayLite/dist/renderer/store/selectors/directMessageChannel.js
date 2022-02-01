"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.targetRecipientAddress = void 0;
const reselect_1 = require("reselect");
const directMessageChannel = (s) => s.directMessageChannel;
exports.targetRecipientAddress = (0, reselect_1.createSelector)(directMessageChannel, d => d.targetRecipientAddress);
exports.default = {
    directMessageChannel,
    targetRecipientAddress: exports.targetRecipientAddress
};
