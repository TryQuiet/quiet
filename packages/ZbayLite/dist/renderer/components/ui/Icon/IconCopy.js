"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IconCopy = void 0;
const react_1 = __importDefault(require("react"));
const styles_1 = require("@material-ui/core/styles");
const useStyles = (0, styles_1.makeStyles)({
    root: {},
    main: {
        padding: 0,
        margin: 0
    },
    squareTop: {
        position: 'absolute',
        left: 4,
        top: 7
    },
    gradient: {
        maxWidth: 50,
        padding: 2,
        position: 'relative',
        backgroundImage: 'linear-gradient(315deg, #521576, #e42656)'
    },
    squareFill: {
        background: 'white',
        color: 'white',
        padding: 5
    },
    squareBottom: {
        position: 'absolute',
        left: 9,
        top: 2
    }
});
const IconCopy = () => {
    const classes = useStyles({});
    return (react_1.default.createElement("div", null,
        react_1.default.createElement("div", { className: classes.squareTop },
            react_1.default.createElement("div", { className: classes.gradient },
                react_1.default.createElement("div", { className: classes.squareFill }))),
        react_1.default.createElement("div", { className: classes.squareBottom },
            react_1.default.createElement("div", { className: classes.gradient },
                react_1.default.createElement("div", { className: classes.squareFill })))));
};
exports.IconCopy = IconCopy;
exports.default = exports.IconCopy;
