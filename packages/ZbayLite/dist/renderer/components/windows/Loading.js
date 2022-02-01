"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Loading = void 0;
const react_1 = __importDefault(require("react"));
const styles_1 = require("@material-ui/core/styles");
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const LinearProgress_1 = __importDefault(require("@material-ui/core/LinearProgress"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
require("react-alice-carousel/lib/alice-carousel.css");
const Icon_1 = __importDefault(require("../ui/Icon/Icon"));
const logo_lockup__circle_svg_1 = __importDefault(require("../../static/images/zcash/logo-lockup--circle.svg"));
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    root: {
        width: '100vw',
        height: '100vh',
        WebkitAppRegion: process.platform === 'win32' ? 'no-drag' : 'drag'
    },
    icon: {
        width: 285,
        height: 67
    },
    svg: {
        width: 100,
        height: 100
    },
    progressBarContainer: {
        width: 254
    },
    progressBar: {
        backgroundColor: theme.palette.colors.lushSky
    },
    carouselContainer: {
        marginTop: theme.spacing(5)
    },
    messageContainer: {
        marginTop: 16
    },
    message: {
        color: theme.palette.colors.darkGray,
        fontSize: 16
    }
}));
const Loading = ({ message }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(Grid_1.default, { className: classes.root, container: true, direction: 'column', justify: 'center', alignItems: 'center' },
        react_1.default.createElement(Grid_1.default, { container: true, item: true, justify: 'center' },
            react_1.default.createElement(Icon_1.default, { className: classes.icon, src: logo_lockup__circle_svg_1.default })),
        react_1.default.createElement(Grid_1.default, { className: classes.progressBarContainer, item: true },
            react_1.default.createElement(LinearProgress_1.default, { className: classes.progressBar })),
        react_1.default.createElement(Grid_1.default, { className: classes.messageContainer, item: true },
            react_1.default.createElement(Typography_1.default, { className: classes.message, variant: 'caption' }, message))));
};
exports.Loading = Loading;
exports.default = exports.Loading;
