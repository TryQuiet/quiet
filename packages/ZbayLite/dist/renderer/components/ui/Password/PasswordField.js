"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.PasswordField = void 0;
const react_1 = __importStar(require("react"));
const formik_1 = require("formik");
const formik_material_ui_1 = require("formik-material-ui");
const InputAdornment_1 = __importDefault(require("@material-ui/core/InputAdornment"));
const IconButton_1 = __importDefault(require("@material-ui/core/IconButton"));
const Visibility_1 = __importDefault(require("@material-ui/icons/Visibility"));
const VisibilityOff_1 = __importDefault(require("@material-ui/icons/VisibilityOff"));
const PasswordField = (_a) => {
    var { name, label = '' } = _a, props = __rest(_a, ["name", "label"]);
    const [visible, setVisible] = (0, react_1.useState)(false);
    return (react_1.default.createElement(formik_1.Field, Object.assign({ name: name, component: formik_material_ui_1.TextField, type: visible ? 'text' : 'password', label: label, variant: 'outlined', InputProps: {
            endAdornment: (react_1.default.createElement(InputAdornment_1.default, { position: 'end', style: { padding: 0 } },
                react_1.default.createElement(IconButton_1.default, { "aria-label": 'Toggle password visibility', onClick: () => setVisible(!visible), tabIndex: -1 }, visible ? react_1.default.createElement(Visibility_1.default, null) : react_1.default.createElement(VisibilityOff_1.default, null))))
        } }, props)));
};
exports.PasswordField = PasswordField;
exports.default = exports.PasswordField;
