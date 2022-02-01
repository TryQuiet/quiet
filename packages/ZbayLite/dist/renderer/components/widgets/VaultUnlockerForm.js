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
exports.VaultUnlockerForm = void 0;
const react_1 = __importStar(require("react"));
const Yup = __importStar(require("yup"));
const formik_1 = require("formik");
const react_router_1 = require("react-router");
const classnames_1 = __importDefault(require("classnames"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const styles_1 = require("@material-ui/core/styles");
const Icon_1 = __importDefault(require("../ui/Icon/Icon"));
const LoadingButton_1 = __importDefault(require("../ui/LoadingButton/LoadingButton"));
const logo_lockup__circle_svg_1 = __importDefault(require("../../static/images/zcash/logo-lockup--circle.svg"));
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    paper: {
        width: '100vw',
        height: '100vh',
        padding: 20,
        WebkitAppRegion: process.platform === 'win32' ? 'no-drag' : 'drag'
    },
    icon: {
        width: 285,
        height: 67
    },
    logoContainer: {
        height: 167
    },
    passwordField: {
        width: 286
    },
    title: {
        textAlign: 'center',
        width: 456,
        fontSize: 14,
        color: theme.palette.colors.black30,
        lineHeight: '20px'
    },
    torDiv: {
        marginTop: -8
    },
    status: {
        width: '100%',
        textAlign: 'center'
    },
    progressBar: {
        backgroundColor: theme.palette.colors.linkBlue
    },
    rootBar: {
        width: 250
    },
    moreOptionsButton: {
        color: theme.palette.colors.lushSky
    },
    carouselContainer: {
        width: 450,
        height: 100
    },
    existingUser: {
        fontSize: 24,
        lineHeight: '36px',
        color: theme.palette.colors.trueBlack,
        margin: 0
    }
}));
const formSchema = Yup.object().shape({
    password: Yup.string().required('Required')
});
const VaultUnlockerForm = ({ onSubmit, isNewUser }) => {
    const classes = useStyles({});
    const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production';
    const [done, setDone] = (0, react_1.useState)(true);
    const [syncingStart, setSyncingStart] = (0, react_1.useState)(false);
    react_1.default.useEffect(() => {
        setSyncingStart(true);
        onSubmit(setDone);
    }, []);
    return (react_1.default.createElement(formik_1.Formik, { initialValues: {}, onSubmit: () => { }, validationSchema: isDev ? null : formSchema },
        react_1.default.createElement(formik_1.Form, null,
            react_1.default.createElement(Grid_1.default, { direction: 'column', spacing: !isNewUser ? 4 : 6, alignItems: 'center', alignContent: 'center' },
                react_1.default.createElement(Grid_1.default, { className: classes.logoContainer, container: true, item: true, xs: 12, justify: 'center', alignItems: 'center', alignContent: 'center' },
                    react_1.default.createElement(Icon_1.default, { className: classes.icon, src: logo_lockup__circle_svg_1.default })),
                react_1.default.createElement(Grid_1.default, { container: true, item: true, xs: 12, wrap: 'wrap', justify: 'center' },
                    react_1.default.createElement(Typography_1.default, { className: (0, classnames_1.default)({
                            [classes.title]: true,
                            [classes.existingUser]: !isNewUser
                        }), variant: 'body1', gutterBottom: true }, !isNewUser ? 'Welcome Back' : 'Welcome to Zbay!')),
                react_1.default.createElement(Grid_1.default, { container: true, item: true, justify: 'center' },
                    react_1.default.createElement(LoadingButton_1.default, { type: 'submit', variant: 'contained', size: 'large', color: 'primary', fullWidth: true, text: !isNewUser ? 'Sign in' : 'Connect Now', disabled: !done || syncingStart, inProgress: !done || syncingStart }))),
            react_1.default.createElement(react_router_1.Redirect, { to: '/main/channel/general' }))));
};
exports.VaultUnlockerForm = VaultUnlockerForm;
exports.default = exports.VaultUnlockerForm;
