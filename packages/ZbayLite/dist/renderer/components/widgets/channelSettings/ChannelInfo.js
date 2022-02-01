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
exports.ChannelInfo = exports.formSchema = void 0;
const react_1 = __importDefault(require("react"));
const Yup = __importStar(require("yup"));
const formik_1 = require("formik");
const react_virtualized_1 = require("react-virtualized");
const rc_scrollbars_1 = require("rc-scrollbars");
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const Button_1 = __importDefault(require("@material-ui/core/Button"));
const styles_1 = require("@material-ui/core/styles");
const TextField_1 = __importDefault(require("../../ui/TextField/TextField"));
const CheckboxWithLabel_1 = __importDefault(require("../../ui/Checkbox/CheckboxWithLabel"));
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    submitButton: {},
    label: {
        fontSize: 12,
        color: theme.palette.colors.black30
    },
    button: {
        marginTop: 32,
        height: 60,
        width: 102,
        fontSize: 16,
        backgroundColor: theme.palette.colors.zbayBlue
    },
    title: {
        marginBottom: 24
    },
    channelDescription: {},
    descriptionDiv: {
        width: '100%'
    },
    checkboxDiv: {
        marginTop: 10
    },
    checkboxLabel: {
        fontSize: 14
    },
    rootClass: {
        marginRight: 0
    },
    divMoney: {
        paddingLeft: 22,
        width: '100%',
        marginTop: 16,
        minHeight: 42,
        '& .MuiFormHelperText-contained': {
            display: 'none'
        }
    },
    moneyDiv: {
        width: 147
    },
    moneyInput: {
        height: 42,
        '& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
            display: 'none'
        }
    },
    exchangeDiv: {
        width: 32
    },
    inputMark: {
        color: theme.palette.colors.darkGray
    },
    wrapper: {
        padding: '0px 25px'
    }
}));
exports.formSchema = Yup.object().shape({
    updateChannelDescription: Yup.string(),
    amountUsd: Yup.number().min(0),
    amountZec: Yup.number()
        .max(1)
        .min(0),
    updateMinFee: Yup.boolean(),
    updateOnlyRegistered: Yup.boolean()
});
const ChannelInfo = ({ initialValues = {
    updateChannelDescription: '',
    firstName: ''
}, updateChannelSettings }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(react_virtualized_1.AutoSizer, null, ({ width, height }) => (react_1.default.createElement(rc_scrollbars_1.Scrollbars, { autoHideTimeout: 500, style: { width: width + 50, height: height } },
        react_1.default.createElement(Grid_1.default, { container: true, className: classes.wrapper },
            react_1.default.createElement(Grid_1.default, { item: true, container: true },
                react_1.default.createElement(formik_1.Formik, { onSubmit: updateChannelSettings, validationSchema: exports.formSchema, initialValues: initialValues }, ({ values, isSubmitting, isValid }) => {
                    return (react_1.default.createElement(formik_1.Form, null,
                        react_1.default.createElement(Grid_1.default, { container: true, direction: 'column', alignItems: 'flex-start' },
                            react_1.default.createElement(Grid_1.default, { item: true, className: classes.title },
                                react_1.default.createElement(Typography_1.default, { variant: 'h3' }, "Channel Info")),
                            react_1.default.createElement(Grid_1.default, { item: true, className: classes.descriptionDiv },
                                react_1.default.createElement(Typography_1.default, { className: classes.label, variant: 'body2' }, "Channel Description"),
                                react_1.default.createElement(TextField_1.default, { name: 'updateChannelDescription', className: classes.channelDescription, variant: 'outlined', multiline: true, fullWidth: true, rows: 5, value: values.firstName })),
                            react_1.default.createElement(Grid_1.default, { item: true, className: classes.checkboxDiv },
                                react_1.default.createElement(CheckboxWithLabel_1.default, { name: 'updateOnlyRegistered', label: 'Allow only registered users to send messages', labelClass: classes.checkboxLabel, rootClass: classes.rootClass })),
                            react_1.default.createElement(Grid_1.default, { item: true, className: classes.checkboxDiv },
                                react_1.default.createElement(CheckboxWithLabel_1.default, { name: 'updateMinFee', label: 'Set the price to post an offer (default is 0.00 ZEC)', labelClass: classes.checkboxLabel, rootClass: classes.rootClass })),
                            react_1.default.createElement(Grid_1.default, { item: true, className: classes.submitButton },
                                react_1.default.createElement(Button_1.default, { variant: 'contained', size: 'large', color: 'primary', type: 'submit', fullWidth: true, disabled: !isValid || isSubmitting, className: classes.button }, "Save")))));
                })))))));
};
exports.ChannelInfo = ChannelInfo;
exports.default = exports.ChannelInfo;
