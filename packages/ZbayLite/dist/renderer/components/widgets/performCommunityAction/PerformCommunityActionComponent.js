"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformCommunityActionComponent = void 0;
const react_1 = __importDefault(require("react"));
const classnames_1 = __importDefault(require("classnames"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const styles_1 = require("@material-ui/core/styles");
const Modal_1 = __importDefault(require("../../ui/Modal/Modal"));
const LoadingButton_1 = require("../../ui/LoadingButton/LoadingButton");
const community_keys_1 = require("./community.keys");
const PerformCommunityAction_dictionary_1 = require("./PerformCommunityAction.dictionary");
const textInput_1 = require("../../../forms/components/textInput");
const react_hook_form_1 = require("react-hook-form");
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
const PerformCommunityActionComponent = ({ open, communityAction, handleCommunityAction, handleRedirection, handleClose, isConnectionReady = true, community }) => {
    var _a;
    const classes = useStyles({});
    const dictionary = communityAction === community_keys_1.CommunityAction.Create
        ? (0, PerformCommunityAction_dictionary_1.CreateCommunityDictionary)(handleRedirection)
        : (0, PerformCommunityAction_dictionary_1.JoinCommunityDictionary)(handleRedirection);
    const { handleSubmit, formState: { errors }, control } = (0, react_hook_form_1.useForm)({
        mode: 'onTouched'
    });
    const onSubmit = (values) => submitForm(handleCommunityAction, values);
    const submitForm = (handleSubmit, values) => {
        handleSubmit(values.name);
    };
    return (react_1.default.createElement(Modal_1.default, { open: open, handleClose: handleClose, isCloseDisabled: !community },
        react_1.default.createElement(Grid_1.default, { container: true, className: classes.main, direction: 'column' },
            react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement(Grid_1.default, { className: classes.title, item: true },
                    react_1.default.createElement(Typography_1.default, { variant: 'h3' }, dictionary.header)),
                react_1.default.createElement("form", { onSubmit: handleSubmit(onSubmit) },
                    react_1.default.createElement(Grid_1.default, { container: true },
                        react_1.default.createElement(Grid_1.default, { className: classes.field, item: true, xs: 12 },
                            react_1.default.createElement(Typography_1.default, { variant: 'caption', className: classes.label },
                                dictionary.label,
                                ' '),
                            react_1.default.createElement(react_hook_form_1.Controller, { control: control, defaultValue: '', rules: dictionary.field.validation, name: 'name', render: ({ field }) => (react_1.default.createElement(textInput_1.TextInput, Object.assign({}, dictionary.field.fieldProps, { fullWidth: true, classes: (0, classnames_1.default)({
                                        [classes.focus]: true,
                                        [classes.margin]: true,
                                        [classes.error]: errors.name
                                    }), placeholder: dictionary.placeholder, errors: errors, onchange: field.onChange, onblur: field.onBlur, value: field.value }))) })),
                        react_1.default.createElement(Grid_1.default, { item: true, xs: 12, className: classes.infoDiv },
                            react_1.default.createElement(Typography_1.default, { variant: 'caption', className: classes.info }, dictionary.hint))),
                    react_1.default.createElement(Grid_1.default, { container: true, direction: 'row', justify: 'flex-start', spacing: 2 },
                        react_1.default.createElement(Grid_1.default, { item: true, xs: 'auto', className: classes.buttonDiv },
                            react_1.default.createElement(LoadingButton_1.LoadingButton, { type: 'submit', variant: 'contained', size: 'small', color: 'primary', fullWidth: true, text: (_a = dictionary.button) !== null && _a !== void 0 ? _a : 'Continue', classes: { button: classes.button }, disabled: !isConnectionReady })))),
                react_1.default.createElement(Grid_1.default, { style: { marginTop: '24px' } }, dictionary.redirection)))));
};
exports.PerformCommunityActionComponent = PerformCommunityActionComponent;
exports.default = exports.PerformCommunityActionComponent;
