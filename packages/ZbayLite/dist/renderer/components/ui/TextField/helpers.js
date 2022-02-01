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
exports.formikLinkedTextField = void 0;
const react_1 = __importDefault(require("react"));
const formik_material_ui_1 = require("formik-material-ui");
const formikLinkedTextField = (_a) => {
    var { variant, transformer, otherField, precise } = _a, props = __rest(_a, ["variant", "transformer", "otherField", "precise"]);
    const decimalPlaces = precise || 4;
    return (react_1.default.createElement(formik_material_ui_1.TextField, Object.assign({ variant: 'outlined' }, props, { inputProps: {
            onChange: (event) => {
                const value = event.currentTarget.value;
                props.form.setFieldValue(props.field.name, value);
                props.form.setFieldValue(otherField, (Number(value) * transformer).toFixed(decimalPlaces));
            }
        } })));
};
exports.formikLinkedTextField = formikLinkedTextField;
