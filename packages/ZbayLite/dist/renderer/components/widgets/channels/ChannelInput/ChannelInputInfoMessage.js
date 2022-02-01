"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const core_1 = require("@material-ui/core");
const styles_1 = require("@material-ui/core/styles");
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    info: {
        color: theme.palette.colors.trueBlack,
        width: '100px',
        letterSpacing: '0.4px'
    },
    bold: {
        fontWeight: 'bold'
    },
    boot: {
        height: '24px',
        width: '100%',
        padding: '0px 20px'
    }
}));
const ChannelInputInfoMessage = ({ showInfoMessage, inputState }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(core_1.Grid, { container: true, className: classes.boot },
        react_1.default.createElement(core_1.Grid, { item: true, xs: true }, showInfoMessage && (react_1.default.createElement(core_1.Typography, { variant: 'caption', className: classes.info }, inputState === 0
            ? 'Loading messages and connecting. This may take a few minutes...'
            : 'This user needs to update Zbay to receive direct messages.')))));
};
exports.default = ChannelInputInfoMessage;
