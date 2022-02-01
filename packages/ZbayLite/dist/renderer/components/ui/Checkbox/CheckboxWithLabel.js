"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckboxWithLabel = void 0;
const react_1 = __importDefault(require("react"));
const styles_1 = require("@material-ui/core/styles");
const formik_1 = require("formik");
const formik_material_ui_1 = require("formik-material-ui");
const FormControlLabel_1 = __importDefault(require("@material-ui/core/FormControlLabel"));
const CheckBoxOutlineBlank_1 = __importDefault(require("@material-ui/icons/CheckBoxOutlineBlank"));
const CheckBox_1 = __importDefault(require("@material-ui/icons/CheckBox"));
const StyledCheckbox = (0, styles_1.withStyles)({})((props) => (react_1.default.createElement(formik_material_ui_1.Checkbox, Object.assign({}, props, { checkedIcon: react_1.default.createElement(CheckBox_1.default, { style: { fontSize: '18px' } }), icon: react_1.default.createElement(CheckBoxOutlineBlank_1.default, { style: { fontSize: '18px' } }) }))));
const CheckboxWithLabel = ({ name, label, labelClass, rootClass }) => (react_1.default.createElement(FormControlLabel_1.default, { label: label, classes: { root: rootClass, label: labelClass }, control: react_1.default.createElement(formik_1.Field, { name: name, component: StyledCheckbox, color: 'primary' }) }));
exports.CheckboxWithLabel = CheckboxWithLabel;
exports.default = exports.CheckboxWithLabel;
