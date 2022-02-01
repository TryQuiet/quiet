"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockClasses = exports.mockEvent = void 0;
const mockEvent = (value) => ({ target: { value } });
exports.mockEvent = mockEvent;
exports.mockClasses = new Proxy({}, { get: (_obj, key) => `${String(key)}-mock` });
exports.default = {
    mockEvent: exports.mockEvent,
    mockClasses: exports.mockClasses
};
