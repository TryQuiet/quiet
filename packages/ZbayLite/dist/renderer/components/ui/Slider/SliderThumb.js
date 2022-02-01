"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SliderThumb = void 0;
const react_1 = __importDefault(require("react"));
const styles_1 = require("@material-ui/core/styles");
const useStyles = (0, styles_1.makeStyles)({
    root: {
        width: 18,
        height: 18,
        background: '#d8d8d8',
        borderColor: '#979797',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: '50%'
    }
});
const SliderThumb = () => {
    const classes = useStyles({});
    return react_1.default.createElement("div", { className: classes.root });
};
exports.SliderThumb = SliderThumb;
exports.default = exports.SliderThumb;
