"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkedTextField = void 0;
const react_1 = __importDefault(require("react"));
const formik_1 = require("formik");
const helpers_1 = require("./helpers");
const LinkedTextField = (_a) => {
    var { name, label = '' } = _a, props = __rest(_a, ["name", "label"]);
    return (react_1.default.createElement(formik_1.Field, Object.assign({ name: name, component: helpers_1.formikLinkedTextField, label: label, variant: 'outlined', type: 'number', fullWidth: true }, props)));
};
exports.LinkedTextField = LinkedTextField;
exports.default = exports.LinkedTextField;
