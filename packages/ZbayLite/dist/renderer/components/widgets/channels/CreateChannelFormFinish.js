"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateChannelFormFinish = void 0;
const react_1 = __importDefault(require("react"));
const core_1 = require("@material-ui/core");
const styles_1 = require("@material-ui/core/styles");
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    rootBar: {
        width: 350,
        marginTop: 32,
        marginBottom: 16
    },
    progressBar: {
        backgroundColor: theme.palette.colors.linkBlue
    },
    info: {
        lineHeight: '19px',
        color: theme.palette.colors.darkGray
    }
}));
const CreateChannelFormFinish = () => {
    const classes = useStyles({});
    return (react_1.default.createElement(core_1.Grid, { container: true, alignItems: 'center', justify: 'center' },
        react_1.default.createElement(core_1.Grid, { item: true },
            react_1.default.createElement(core_1.Typography, { variant: 'h3' }, "Creating Channel")),
        react_1.default.createElement(core_1.Grid, { item: true, container: true, justify: 'center', alignItems: 'center' },
            react_1.default.createElement(core_1.LinearProgress, { classes: {
                    root: classes.rootBar,
                    barColorPrimary: classes.progressBar
                } })),
        react_1.default.createElement(core_1.Grid, { item: true },
            react_1.default.createElement(core_1.Typography, { variant: 'body1', className: classes.info }, "Generating keys"))));
};
exports.CreateChannelFormFinish = CreateChannelFormFinish;
exports.default = exports.CreateChannelFormFinish;
