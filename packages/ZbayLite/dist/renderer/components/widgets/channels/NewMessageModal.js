"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewMessageModal = void 0;
const react_1 = __importDefault(require("react"));
const formik_1 = require("formik");
const core_1 = require("@material-ui/core");
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const styles_1 = require("@material-ui/core/styles");
const Button_1 = __importDefault(require("@material-ui/core/Button"));
const TextField_1 = __importDefault(require("@material-ui/core/TextField"));
const TextField_2 = require("../../ui/TextField/TextField");
const Modal_1 = __importDefault(require("../../ui/Modal/Modal"));
const Autocomplete_1 = require("../../ui/Autocomplete/Autocomplete");
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
    gutter: {
        marginBottom: theme.spacing(4),
        marginTop: 0
    },
    button: {
        marginTop: 24,
        width: 165,
        backgroundColor: theme.palette.colors.zbayBlue,
        color: theme.palette.colors.white,
        '&:hover': {
            backgroundColor: theme.palette.colors.zbayBlue
        }
    },
    title: {
        marginBottom: 24
    }
}));
const NewMessageModal = ({ open, handleClose, sendMessage, users }) => {
    const classes = useStyles({});
    const usersArray = Array.from(Object.values(users));
    return (react_1.default.createElement(Modal_1.default, { open: open, handleClose: handleClose, title: '', fullPage: true },
        react_1.default.createElement(Grid_1.default, { className: classes.root },
            react_1.default.createElement(formik_1.Formik, { initialValues: {
                    recipient: '',
                    message: '',
                    user: {}
                }, onSubmit: (values, { resetForm }) => {
                    const isAddressValid = /^t1[a-zA-Z0-9]{33}$|^ztestsapling1[a-z0-9]{75}$|^zs1[a-z0-9]{75}$/.test(values.recipient);
                    const targetUser = usersArray.find(user => user.username === values.recipient);
                    let payload;
                    if (targetUser) {
                        payload = {
                            message: values.message || '',
                            spent: 0.0,
                            receiver: {
                                username: targetUser.username
                            }
                        };
                        sendMessage(payload);
                        handleClose();
                        resetForm();
                        return;
                    }
                    if (isAddressValid) {
                        payload = {
                            message: values.message || '',
                            spent: 0.0,
                            receiver: {
                                replyTo: values.recipient,
                                username: values.recipient.substring(0, 15)
                            }
                        };
                        sendMessage(payload);
                        handleClose();
                        resetForm();
                    }
                } }, ({ values, setFieldValue }) => (react_1.default.createElement(formik_1.Form, { className: classes.fullContainer },
                react_1.default.createElement(Grid_1.default, { container: true, justify: 'flex-start', direction: 'column', className: classes.fullContainer },
                    react_1.default.createElement(core_1.Typography, { variant: 'h3', className: classes.title }, "New message"),
                    react_1.default.createElement(core_1.Typography, { variant: 'body2' }, "Recipient"),
                    react_1.default.createElement(Autocomplete_1.AutocompleteField, { freeSolo: true, name: 'recipient', inputValue: values.recipient || '', options: usersArray.map(option => option.username), value: values.recipient, onChange: (_e, v) => setFieldValue('recipient', v), onInputChange: (_e, v) => {
                            setFieldValue('recipient', v);
                        }, renderInput: params => (react_1.default.createElement(TextField_1.default, Object.assign({}, params, { className: classes.gutter, variant: 'outlined', multiline: true, rowsMax: 7, placeholder: 'Enter Zcash address or Zbay username', margin: 'normal', fullWidth: true }))) }),
                    react_1.default.createElement(core_1.Typography, { variant: 'body2' }, "Message text"),
                    react_1.default.createElement(TextField_2.TextField, { name: 'message', placeholder: 'Enter message (optional)', InputProps: {}, disabled: false }),
                    react_1.default.createElement(Button_1.default, { className: classes.button, variant: 'contained', color: 'primary', size: 'large', type: 'submit' }, "Send message"))))))));
};
exports.NewMessageModal = NewMessageModal;
exports.default = exports.NewMessageModal;
