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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Main = void 0;
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const classnames_1 = __importDefault(require("classnames"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const styles_1 = require("@material-ui/core/styles");
const WindowWrapper_1 = __importDefault(require("../ui/WindowWrapper/WindowWrapper"));
const Sidebar_1 = __importDefault(require("../widgets/sidebar/Sidebar"));
const Channel_1 = __importDefault(require("../../containers/pages/Channel"));
const useStyles = (0, styles_1.makeStyles)(() => ({
    gridRoot: {
        'min-height': '100vh',
        'min-width': '100vw',
        overflow: 'hidden',
        position: 'relative'
    },
    logsContainer: {
        'z-index': 2000,
        position: 'absolute',
        top: 0,
        right: 0
    }
}));
const Main = ({ match, isLogWindowOpened }) => {
    const classes = useStyles({});
    const debounce = (fn, ms) => {
        let timer;
        return _ => {
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(_ => {
                timer = null;
                fn.apply(this); // eslint-disable-line
            }, ms);
        };
    };
    const [dimensions, setDimensions] = react_1.default.useState({
        height: window.innerHeight,
        width: window.innerWidth
    });
    (0, react_1.useEffect)(() => {
        const debouncedHandleResize = debounce(function handleResize() {
            setDimensions({
                height: window.innerHeight,
                width: window.innerWidth
            });
        }, 1000);
        window.addEventListener('resize', debouncedHandleResize);
        return () => {
            window.removeEventListener('resize', debouncedHandleResize);
        };
    });
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(WindowWrapper_1.default, null,
            react_1.default.createElement(Grid_1.default, { container: true, direction: 'row', className: classes.gridRoot },
                react_1.default.createElement(Grid_1.default, { item: true },
                    react_1.default.createElement(Sidebar_1.default, null)),
                react_1.default.createElement(Grid_1.default, { item: true, xs: true },
                    react_1.default.createElement(react_router_dom_1.Route, { path: `${match.url}/channel/:id`, component: Channel_1.default })),
                isLogWindowOpened && (react_1.default.createElement(Grid_1.default, { className: (0, classnames_1.default)({
                        [classes.logsContainer]: dimensions.width <= 900
                    }), item: true }))))));
};
exports.Main = Main;
exports.default = exports.Main;
