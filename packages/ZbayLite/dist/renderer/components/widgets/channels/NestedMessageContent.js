"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NestedMessageContent = void 0;
const core_1 = require("@material-ui/core");
const react_1 = __importDefault(require("react"));
const useStyles = (0, core_1.makeStyles)(() => ({
    message: {
        marginTop: '-3px',
        fontSize: '0.855rem',
        whiteSpace: 'pre-line',
        lineHeight: '21px'
    },
    firstMessage: {
        paddingTop: 0
    },
    nextMessage: {
        paddingTop: 4
    }
}));
const NestedMessageContent = ({ message, index }) => {
    const classes = useStyles({});
    const outerDivStyle = index > 0 ? classes.nextMessage : classes.firstMessage;
    return (react_1.default.createElement(core_1.Grid, { item: true, className: outerDivStyle },
        react_1.default.createElement(core_1.Typography, { className: classes.message, "data-testid": `messagesGroupContent-${message.id}` }, message.message)));
};
exports.NestedMessageContent = NestedMessageContent;
exports.default = exports.NestedMessageContent;
