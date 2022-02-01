"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateChannelForm = exports.showParsedMessage = void 0;
const react_1 = __importDefault(require("react"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const styles_1 = require("@material-ui/core/styles");
const core_1 = require("@material-ui/core");
const LoadingButton_1 = __importDefault(require("../../ui/LoadingButton/LoadingButton"));
const textInput_1 = require("../../../forms/components/textInput");
const react_hook_form_1 = require("react-hook-form");
const createChannelFields_1 = require("../../../forms/fields/createChannelFields");
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    fullContainer: {
        width: '100%',
        height: '100%'
    },
    gutter: {
        marginTop: 8,
        marginBottom: 24
    },
    button: {
        width: 165,
        backgroundColor: theme.palette.colors.zbayBlue,
        color: theme.palette.colors.white,
        '&:hover': {
            backgroundColor: theme.palette.colors.zbayBlue
        },
        textTransform: 'none',
        height: 48,
        fontWeight: 'normal'
    },
    title: {
        marginBottom: 24
    },
    warrningIcon: {
        color: '#FFCC00'
    },
    iconDiv: {
        width: 24,
        height: 28,
        marginRight: 8
    },
    warrningMessage: {
        wordBreak: 'break-word'
    }
}));
const showParsedMessage = (message = '') => {
    return message.includes(' ') || message !== message.toLowerCase();
};
exports.showParsedMessage = showParsedMessage;
const channelFields = {
    channelName: (0, createChannelFields_1.channelNameField)()
};
const CreateChannelForm = ({ setStep }) => {
    const classes = useStyles({});
    const { handleSubmit, formState: { errors }, control } = (0, react_hook_form_1.useForm)({
        mode: 'onTouched'
    });
    const onSubmit = () => {
        // (values, formActions) => {
        //   onSubmit(
        //     { ...values, name: parseChannelName(values.name) },
        //     formActions,
        //     setStep
        //   )
        // }
        setStep(1);
    };
    return (react_1.default.createElement("form", { onSubmit: handleSubmit(onSubmit) },
        react_1.default.createElement(Grid_1.default, { container: true, justify: 'flex-start', direction: 'column', className: classes.fullContainer },
            react_1.default.createElement(core_1.Typography, { variant: 'h3', className: classes.title }, "Create a new private channel (temporarily disabled)"),
            react_1.default.createElement(core_1.Typography, { variant: 'body2' }, "Channel name"),
            react_1.default.createElement(react_hook_form_1.Controller, { control: control, defaultValue: '', rules: channelFields.channelName.validation, name: 'channelName', render: ({ field }) => (react_1.default.createElement(textInput_1.TextInput, Object.assign({ name: 'name', defaultValue: '', variant: 'outlined', errors: errors, classes: '' }, channelFields.channelName.fieldProps, { fullWidth: true, onchange: field.onChange, onblur: field.onBlur, value: field.value, placeholder: 'Enter a channel name' }))) }),
            react_1.default.createElement("div", { className: classes.gutter }),
            react_1.default.createElement(LoadingButton_1.default, { variant: 'contained', color: 'primary', disabled: false, inProgress: false, type: 'submit', text: 'Create Channel', classes: { button: classes.button } }))));
};
exports.CreateChannelForm = CreateChannelForm;
exports.default = exports.CreateChannelForm;
