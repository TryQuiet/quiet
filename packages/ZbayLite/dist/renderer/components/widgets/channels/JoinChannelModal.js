"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JoinChannelModal = void 0;
const react_1 = __importDefault(require("react"));
const luxon_1 = require("luxon");
const formik_1 = require("formik");
const core_1 = require("@material-ui/core");
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const styles_1 = require("@material-ui/core/styles");
const TextField_1 = __importDefault(require("@material-ui/core/TextField"));
const Modal_1 = __importDefault(require("../../ui/Modal/Modal"));
const Autocomplete_1 = require("../../ui/Autocomplete/Autocomplete");
const LoadingButton_1 = __importDefault(require("../../ui/LoadingButton/LoadingButton"));
const useStyles = (0, styles_1.makeStyles)(theme => ({
    root: {
        padding: 32,
        height: '100%',
        width: '100%'
    },
    fullContainer: {
        width: '100%',
        height: '100%'
    },
    input: {
        marginBottom: 0,
        marginTop: 0,
        width: '100%'
    },
    button: {
        width: 151,
        height: 60,
        fontSize: 16,
        backgroundColor: theme.palette.colors.zbayBlue,
        color: theme.palette.colors.white,
        '&:hover': {
            backgroundColor: theme.palette.colors.zbayBlue
        }
    },
    title: {
        marginBottom: 24
    },
    info: {
        marginTop: 8,
        lineHeight: '18px',
        color: theme.palette.colors.darkGray,
        letterSpacing: '0.4px'
    },
    channelTitle: {
        lineHeight: '26px',
        fontSize: 16
    },
    channelInfo: {
        lineHeight: '18px',
        color: theme.palette.colors.darkGray,
        letterSpacing: '0.4px'
    },
    option: {},
    materialOption: {
        height: 68
    },
    timeInfo: {
        marginTop: -16,
        lineHeight: '18px',
        color: theme.palette.colors.darkGray,
        letterSpacing: '0.4px',
        marginBottom: 16
    },
    description: {
        fontSize: 14,
        lineHeight: '24px'
    },
    informationBox: {
        backgroundColor: theme.palette.colors.gray03,
        borderRadius: 4,
        height: 42,
        color: theme.palette.colors.trueBlack,
        letterSpacing: '0.4px',
        lineHeight: '18px',
        fontSize: 12,
        paddingLeft: 16,
        paddingRight: 16,
        marginBottom: 24,
        marginTop: 16
    }
}));
const JoinChannelModal = ({ open, handleClose, joinChannel, publicChannels, users }) => {
    const classes = useStyles({});
    const channelsArray = Array.from(Object.values(publicChannels));
    const [step, setStep] = react_1.default.useState(0);
    const [loading, setLoading] = react_1.default.useState(false);
    return (react_1.default.createElement(Modal_1.default, { open: open, handleClose: () => {
            handleClose();
            setStep(0);
        }, title: '', fullPage: true },
        react_1.default.createElement(Grid_1.default, { className: classes.root },
            react_1.default.createElement(formik_1.Formik, { initialValues: {
                    channel: {
                        name: '',
                        owner: '',
                        timestamp: '',
                        description: ''
                    }
                }, onSubmit: (values, { resetForm }) => __awaiter(void 0, void 0, void 0, function* () {
                    const ch = channelsArray.find(channel => channel.name === values.channel.name);
                    if (ch) {
                        setLoading(true);
                        joinChannel(ch);
                        setLoading(false);
                        setStep(0);
                        handleClose();
                        resetForm();
                    }
                }) }, ({ values, setFieldValue }) => {
                return (react_1.default.createElement(formik_1.Form, { className: classes.fullContainer },
                    react_1.default.createElement(Grid_1.default, { container: true, justify: 'flex-start', direction: 'column', className: classes.fullContainer },
                        react_1.default.createElement(core_1.Typography, { variant: 'h3', className: classes.title }, step === 0 ? 'Search for Channels' : `#${values.channel.name}`),
                        step !== 0 && (react_1.default.createElement(core_1.Typography, { variant: 'caption', className: classes.timeInfo }, `Created by @${users[values.channel.owner]
                            ? users[values.channel.owner].username
                            : 'Unnamed'} on ${luxon_1.DateTime.fromSeconds(parseInt(values.channel.timestamp)).toFormat('LLL d, y')} `)),
                        step === 0 ? (react_1.default.createElement(Autocomplete_1.AutocompleteField, { name: 'channel', classes: { option: classes.materialOption }, options: channelsArray, renderOption: option => {
                                const time = luxon_1.DateTime.fromSeconds(parseInt(option.timestamp));
                                return (react_1.default.createElement(Grid_1.default, { container: true, direction: 'column', className: classes.option },
                                    react_1.default.createElement(core_1.Typography, { variant: 'body1', className: classes.channelTitle }, `#${option.name}`),
                                    react_1.default.createElement(core_1.Typography, { variant: 'caption', className: classes.channelInfo }, `Created by @${users[option.owner] ? users[option.owner].username : 'Unnamed'} on ${time.toFormat('LLL d, y')} `)));
                            }, value: values.channel, onChange: (_e, v) => {
                                setFieldValue('channel', v);
                                setStep(1);
                            }, renderInput: params => (react_1.default.createElement(TextField_1.default, Object.assign({}, params, { className: classes.input, variant: 'outlined', placeholder: 'Search', margin: 'normal' }))) })) : (react_1.default.createElement(react_1.default.Fragment, null,
                            react_1.default.createElement(core_1.Typography, { variant: 'body2', className: classes.description }, `${values.channel.description}`),
                            react_1.default.createElement(Grid_1.default, { container: true, alignItems: 'center', className: classes.informationBox }, "After joining, it may take some time for messages to fully load."))),
                        step !== 0 ? (react_1.default.createElement(LoadingButton_1.default, { variant: 'contained', color: 'primary', size: 'large', type: 'submit', text: 'Join Channel', classes: { button: classes.button }, inProgress: loading, disabled: loading })) : (react_1.default.createElement(core_1.Typography, { variant: 'caption', className: classes.info }, "If you have an invite link, open it in a browser")))));
            }))));
};
exports.JoinChannelModal = JoinChannelModal;
exports.default = exports.JoinChannelModal;
