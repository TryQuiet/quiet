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
exports.CreateChannelComponent = exports.parseChannelName = void 0;
const react_1 = __importStar(require("react"));
const react_hook_form_1 = require("react-hook-form");
const core_1 = require("@material-ui/core");
const styles_1 = require("@material-ui/core/styles");
const Warning_1 = __importDefault(require("@material-ui/icons/Warning"));
const Modal_1 = __importDefault(require("../../../ui/Modal/Modal"));
const LoadingButton_1 = __importDefault(require("../../../ui/LoadingButton/LoadingButton"));
const textInput_1 = require("../../../../forms/components/textInput");
const createChannelFields_1 = require("../../../../forms/fields/createChannelFields");
const useStyles = (0, styles_1.makeStyles)(theme => ({
    main: {
        backgroundColor: theme.palette.colors.white,
        padding: '0px 32px'
    },
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
    iconDiv: {
        width: 24,
        height: 28,
        marginRight: 8
    },
    warrningIcon: {
        color: '#FFCC00'
    },
    warrningMessage: {
        wordBreak: 'break-word'
    },
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
const parseChannelName = (name = '') => {
    return name.toLowerCase().replace(/ +/g, '-');
};
exports.parseChannelName = parseChannelName;
const createChannelFields = {
    channelName: (0, createChannelFields_1.channelNameField)()
};
const CreateChannelComponent = ({ open, createChannel, handleClose }) => {
    const classes = useStyles({});
    const [channelName, setChannelName] = (0, react_1.useState)('');
    const { handleSubmit, formState: { errors }, control, reset } = (0, react_hook_form_1.useForm)({
        mode: 'onTouched'
    });
    const onSubmit = (values) => {
        submitForm(createChannel, values);
        setChannelName('');
        reset();
    };
    const submitForm = (handleSubmit, values) => {
        handleSubmit((0, exports.parseChannelName)(values.channelName));
    };
    const onChange = (name) => {
        const parsedName = (0, exports.parseChannelName)(name);
        setChannelName(parsedName);
    };
    return (react_1.default.createElement(Modal_1.default, { open: open, handleClose: handleClose, "data-testid": 'createChannelModal' },
        react_1.default.createElement(core_1.Grid, { container: true, className: classes.main, direction: 'column' },
            react_1.default.createElement("form", { onSubmit: handleSubmit(onSubmit) },
                react_1.default.createElement(core_1.Grid, { container: true, justify: 'flex-start', direction: 'column', className: classes.fullContainer },
                    react_1.default.createElement(core_1.Typography, { variant: 'h3', className: classes.title }, "Create a new public channel"),
                    react_1.default.createElement(core_1.Typography, { variant: 'body2' }, "Channel name"),
                    react_1.default.createElement(react_hook_form_1.Controller, { control: control, defaultValue: '', rules: createChannelFields.channelName.validation, name: 'channelName', render: ({ field }) => (react_1.default.createElement(textInput_1.TextInput, Object.assign({}, createChannelFields.channelName.fieldProps, { fullWidth: true, classes: '', variant: 'outlined', placeholder: 'Enter a channel name', errors: errors, onchange: event => {
                                event.persist();
                                onChange(event.target.value);
                                field.onChange(event.target.value);
                            }, onblur: field.onBlur, value: field.value, "data-testid": 'createChannelInput' }))) }),
                    react_1.default.createElement("div", { className: classes.gutter }, !errors.channelName && channelName.length > 0 && (react_1.default.createElement(core_1.Grid, { container: true, alignItems: 'center', direction: 'row' },
                        react_1.default.createElement(core_1.Grid, { item: true, className: classes.iconDiv },
                            react_1.default.createElement(Warning_1.default, { className: classes.warrningIcon })),
                        react_1.default.createElement(core_1.Grid, { item: true, xs: true },
                            react_1.default.createElement(core_1.Typography, { variant: 'body2', className: classes.warrningMessage },
                                "Your channel will be created as ",
                                react_1.default.createElement("b", null, `#${channelName}`)))))),
                    react_1.default.createElement(LoadingButton_1.default, { variant: 'contained', color: 'primary', inProgress: false, type: 'submit', text: 'Create Channel', classes: { button: classes.button } }))))));
};
exports.CreateChannelComponent = CreateChannelComponent;
exports.default = exports.CreateChannelComponent;
