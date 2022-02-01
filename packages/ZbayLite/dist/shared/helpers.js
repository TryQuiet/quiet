"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBytesSize = void 0;
const getBytesSize = value => {
    return new TextEncoder().encode(value).length;
};
exports.getBytesSize = getBytesSize;
