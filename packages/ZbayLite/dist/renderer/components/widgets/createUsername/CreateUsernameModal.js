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
exports.CreateUsernameModal = void 0;
const react_1 = __importStar(require("react"));
const classnames_1 = __importDefault(require("classnames"));
const react_hook_form_1 = require("react-hook-form");
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const styles_1 = require("@material-ui/core/styles");
const Modal_1 = __importDefault(require("../../ui/Modal/Modal"));
const UsernameCreated_1 = __importDefault(require("./UsernameCreated"));
const LoadingButton_1 = require("../../ui/LoadingButton/LoadingButton");
const textInput_1 = require("../../../forms/components/textInput");
const createUserFields_1 = require("../../../forms/fields/createUserFields");
const useStyles = (0, styles_1.makeStyles)(theme => ({
    root: {},
    focus: {
        '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
                borderColor: theme.palette.colors.linkBlue
            }
        }
    },
    margin: {
        '& .MuiFormHelperText-contained': {
            margin: '5px 0px'
        }
    },
    error: {
        '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
                borderColor: theme.palette.colors.red
            }
        }
    },
    main: {
        backgroundColor: theme.palette.colors.white,
        padding: '0px 32px'
    },
    title: {
        marginTop: 24
    },
    fullWidth: {
        paddingBottom: 25
    },
    note: {
        fontSize: 14,
        lineHeight: '20px',
        color: theme.palette.colors.black30
    },
    field: {
        marginTop: 18
    },
    buttonDiv: {
        marginTop: 24
    },
    info: {
        lineHeight: '18px',
        color: theme.palette.colors.darkGray,
        letterSpacing: 0.4
    },
    button: {
        width: 139,
        height: 60,
        backgroundColor: theme.palette.colors.purple,
        padding: theme.spacing(2),
        '&:hover': {
            backgroundColor: theme.palette.colors.darkPurple
        },
        '&:disabled': {
            backgroundColor: theme.palette.colors.lightGray,
            color: 'rgba(255,255,255,0.6)'
        }
    },
    closeModal: {
        backgroundColor: 'transparent',
        height: 60,
        fontSize: 16,
        lineHeight: '19px',
        color: theme.palette.colors.darkGray,
        '&:hover': {
            backgroundColor: 'transparent'
        }
    },
    buttonContainer: {
        marginBottom: 49
    },
    label: {
        fontSize: 12,
        color: theme.palette.colors.black30
    },
    link: {
        cursor: 'pointer',
        color: theme.palette.colors.linkBlue
    },
    spacing24: {
        marginTop: 24
    },
    infoDiv: {
        lineHeight: 'initial',
        marginTop: 8
    }
}));
const userFields = {
    userName: (0, createUserFields_1.userNameField)()
};
const CreateUsernameModal = ({ open, handleRegisterUsername, certificateRegistrationError, certificate, handleClose }) => {
    const classes = useStyles({});
    const [formSent, setFormSent] = (0, react_1.useState)(false);
    const responseReceived = Boolean(certificateRegistrationError || certificate);
    const waitingForResponse = formSent && !responseReceived;
    const { handleSubmit, formState: { errors }, setError, control } = (0, react_hook_form_1.useForm)({
        mode: 'onTouched'
    });
    const onSubmit = (values) => {
        submitForm(handleRegisterUsername, values, setFormSent);
    };
    const submitForm = (handleSubmit, values, setFormSent) => {
        setFormSent(true);
        handleSubmit({ nickname: values.userName });
    };
    react_1.default.useEffect(() => {
        if (certificateRegistrationError) {
            setError('userName', { message: certificateRegistrationError });
        }
    }, [certificateRegistrationError]);
    return (react_1.default.createElement(Modal_1.default, { open: open, handleClose: handleClose, testIdPrefix: 'createUsername' },
        react_1.default.createElement(Grid_1.default, { container: true, className: classes.main, direction: 'column' }, !certificate ? (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(Grid_1.default, { className: classes.title, item: true },
                react_1.default.createElement(Typography_1.default, { variant: 'h3' }, "Register a username")),
            react_1.default.createElement("form", { onSubmit: handleSubmit(onSubmit) },
                react_1.default.createElement(Grid_1.default, { container: true },
                    react_1.default.createElement(Grid_1.default, { className: classes.field, item: true, xs: 12 },
                        react_1.default.createElement(Typography_1.default, { variant: 'caption', className: classes.label },
                            "Choose your favorite username:",
                            ' '),
                        react_1.default.createElement(react_hook_form_1.Controller, { control: control, defaultValue: '', rules: userFields.userName.validation, name: 'userName', render: ({ field }) => (react_1.default.createElement(textInput_1.TextInput, Object.assign({}, userFields.userName.fieldProps, { fullWidth: true, classes: (0, classnames_1.default)({
                                    [classes.focus]: true,
                                    [classes.margin]: true,
                                    [classes.error]: errors.userName
                                }), placeholder: 'Enter a username', errors: errors, onPaste: e => e.preventDefault(), variant: 'outlined', onchange: field.onChange, onblur: field.onBlur, value: field.value }))) })),
                    react_1.default.createElement(Grid_1.default, { item: true, xs: 12, className: classes.infoDiv },
                        react_1.default.createElement(Typography_1.default, { variant: 'caption', className: classes.info }, "Your username cannot have any spaces or special characters, must be lowercase letters and numbers only. Cannot be less than 3 and more than 20 characters."))),
                react_1.default.createElement(Grid_1.default, { container: true, direction: 'row', justify: 'flex-start', spacing: 2 },
                    react_1.default.createElement(Grid_1.default, { item: true, xs: 'auto', className: classes.buttonDiv },
                        react_1.default.createElement(LoadingButton_1.LoadingButton, { type: 'submit', variant: 'contained', size: 'small', color: 'primary', fullWidth: true, text: 'Register', classes: { button: classes.button }, disabled: waitingForResponse, inProgress: waitingForResponse })))))) : (react_1.default.createElement(UsernameCreated_1.default, { handleClose: handleClose, setFormSent: setFormSent })))));
};
exports.CreateUsernameModal = CreateUsernameModal;
exports.default = exports.CreateUsernameModal;
