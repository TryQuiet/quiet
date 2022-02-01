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
exports.UserListItem = void 0;
const react_1 = __importStar(require("react"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const styles_1 = require("@material-ui/core/styles");
const ConfirmModal_1 = __importDefault(require("./ConfirmModal"));
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    root: {
        padding: '12px 16px',
        borderBottom: `1px solid ${theme.palette.colors.veryLightGray}`
    },
    name: {
        color: theme.palette.colors.trueBlack,
        fontWeight: 500
    },
    actionName: {
        color: theme.palette.colors.lushSky,
        '&:hover': {
            color: theme.palette.colors.trueBlack
        },
        textTransform: 'lowercase'
    },
    pointer: {
        cursor: 'pointer'
    }
}));
const UserListItem = ({ name, actionName, action, disableConfirmation, prefix = '@' }) => {
    const classes = useStyles({});
    const [openDialog, setOpenDialog] = (0, react_1.useState)(false);
    return (react_1.default.createElement(Grid_1.default, { container: true, item: true, xs: true, className: classes.root, justify: 'space-between', alignItems: 'center' },
        react_1.default.createElement(ConfirmModal_1.default, { open: openDialog, title: `${actionName} '${name}'`, actionName: actionName, handleClose: () => setOpenDialog(false), handleAction: action }),
        react_1.default.createElement(Grid_1.default, { item: true },
            react_1.default.createElement(Typography_1.default, { className: classes.name, variant: 'subtitle1' },
                prefix,
                name)),
        react_1.default.createElement(Grid_1.default, { item: true, className: classes.pointer, onClick: disableConfirmation ? action : () => setOpenDialog(true) },
            react_1.default.createElement(Typography_1.default, { className: classes.actionName, variant: 'body2' }, actionName))));
};
exports.UserListItem = UserListItem;
exports.default = exports.UserListItem;
