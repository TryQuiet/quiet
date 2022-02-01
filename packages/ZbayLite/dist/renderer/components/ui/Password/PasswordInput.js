"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordInput = void 0;
const react_1 = __importDefault(require("react"));
const TextField_1 = __importDefault(require("@material-ui/core/TextField"));
const InputAdornment_1 = __importDefault(require("@material-ui/core/InputAdornment"));
const IconButton_1 = __importDefault(require("@material-ui/core/IconButton"));
const Visibility_1 = __importDefault(require("@material-ui/icons/Visibility"));
const VisibilityOff_1 = __importDefault(require("@material-ui/icons/VisibilityOff"));
const PasswordInput = ({ error = false, label = 'Password', password, passwordVisible, handleTogglePassword, handleSetPassword }) => (react_1.default.createElement(TextField_1.default, { id: 'password', label: label, type: passwordVisible ? 'test' : 'password', value: password, onChange: handleSetPassword, margin: 'normal', variant: 'outlined', InputProps: {
        endAdornment: (react_1.default.createElement(InputAdornment_1.default, { position: 'end' },
            react_1.default.createElement(IconButton_1.default, { "aria-label": 'Toggle password visibility', onClick: handleTogglePassword }, passwordVisible ? react_1.default.createElement(Visibility_1.default, null) : react_1.default.createElement(VisibilityOff_1.default, null))))
    }, error: error, fullWidth: true }));
exports.PasswordInput = PasswordInput;
exports.default = exports.PasswordInput;
