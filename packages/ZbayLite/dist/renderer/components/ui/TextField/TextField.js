"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextField = void 0;
const react_1 = __importDefault(require("react"));
const formik_1 = require("formik");
const formik_material_ui_1 = require("formik-material-ui");
const TextField = ({ props }) => {
    return (react_1.default.createElement(formik_1.Field, Object.assign({ component: formik_material_ui_1.TextField, variant: 'outlined', fullWidth: true }, props)));
};
exports.TextField = TextField;
exports.default = exports.TextField;
