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
exports.AccountSettingsForm = void 0;
const react_1 = __importDefault(require("react"));
const Yup = __importStar(require("yup"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const styles_1 = require("@material-ui/core/styles");
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    createUsernameContainer: {
        paddingTop: 16,
        paddingBottom: 16,
        paddingLeft: 24,
        paddingRight: 24,
        borderRadius: 4,
        backgroundColor: theme.palette.colors.veryLightGray
    },
    container: {
        marginTop: theme.spacing(1)
    },
    textField: {
        width: '100%',
        height: 60
    },
    icon: {
        width: 60,
        height: 60,
        justifyContent: 'center'
    },
    usernameIcon: {
        width: 32,
        height: 32,
        justifyContent: 'center'
    },
    link: {
        cursor: 'pointer',
        color: theme.palette.colors.linkBlue
    },
    info: {
        color: theme.palette.colors.darkGray
    },
    title: {
        marginBottom: 24
    },
    iconBackground: {
        margin: 0,
        padding: 0
    },
    iconBox: {
        margin: 0,
        padding: 5,
        width: 60,
        height: 56,
        backgroundColor: theme.palette.colors.gray30
    },
    adornedEnd: {
        padding: 0
    },
    copyInput: {
        borderRight: `1px solid ${theme.palette.colors.inputGray}`,
        paddingTop: 18,
        paddingBottom: 18,
        paddingLeft: 16
    },
    addressDiv: {
        marginTop: 24
    }
}));
Yup.addMethod(Yup.mixed, 'validateMessage', function (checkNickname) {
    return this.test('test', 'Sorry, username already taken. Please choose another', function (value) {
        return __awaiter(this, void 0, void 0, function* () {
            const isUsernameTaken = yield checkNickname(value);
            return !isUsernameTaken;
        });
    });
});
const AccountSettingsForm = ({ user }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(Grid_1.default, { container: true, direction: 'column' },
        react_1.default.createElement(Grid_1.default, { item: true, className: classes.title },
            react_1.default.createElement(Typography_1.default, { variant: 'h3' }, "Account")),
        react_1.default.createElement(Grid_1.default, { container: true, justify: 'center' },
            react_1.default.createElement(Grid_1.default, { container: true, xs: true, item: true, className: classes.createUsernameContainer },
                react_1.default.createElement(Grid_1.default, { item: true, xs: 12 },
                    react_1.default.createElement(Typography_1.default, { variant: 'h4' },
                        "@",
                        user ? user.zbayNickname : ''))))));
};
exports.AccountSettingsForm = AccountSettingsForm;
exports.default = exports.AccountSettingsForm;
