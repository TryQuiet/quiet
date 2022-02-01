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
exports.TextInput = void 0;
const react_1 = __importDefault(require("react"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const TextField_1 = __importDefault(require("@material-ui/core/TextField"));
const TextInput = (_a) => {
    var _b;
    var { errors, defaultValue, classes, onchange, onblur, name = '' } = _a, props = __rest(_a, ["errors", "defaultValue", "classes", "onchange", "onblur", "name"]);
    const hasError = Boolean(errors === null || errors === void 0 ? void 0 : errors[name]);
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(TextField_1.default, Object.assign({ error: hasError, defaultValue: defaultValue, name: name, className: classes, variant: 'outlined', onChange: onchange, onBlur: onblur }, props)),
        react_1.default.createElement(Typography_1.default, { variant: 'body2', color: 'error' }, ((_b = errors === null || errors === void 0 ? void 0 : errors[name]) === null || _b === void 0 ? void 0 : _b.message) || '')));
};
exports.TextInput = TextInput;
