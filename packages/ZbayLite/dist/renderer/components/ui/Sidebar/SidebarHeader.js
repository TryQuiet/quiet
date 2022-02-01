"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SidebarHeader = void 0;
const react_1 = __importDefault(require("react"));
const classnames_1 = __importDefault(require("classnames"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const IconButton_1 = __importDefault(require("@material-ui/core/IconButton"));
const PlusIconWithBorder_1 = __importDefault(require("../assets/icons/PlusIconWithBorder"));
const Tooltip_1 = __importDefault(require("../Tooltip/Tooltip"));
const styles_1 = require("@material-ui/styles");
const useStyles = (0, styles_1.makeStyles)(() => ({
    root: {
        marginTop: 25,
        height: 32,
        paddingLeft: 16,
        paddingRight: 16
    },
    title: {
        opacity: 0.7,
        fontWeight: 500
    },
    clickable: {
        '&:hover': {
            backgroundColor: 'inherit',
            opacity: 1
        },
        cursor: 'pointer'
    },
    iconButton: {
        opacity: 0.7,
        '&:hover': {
            backgroundColor: 'inherit',
            opacity: 1
        }
    },
    tooltip: {
        marginTop: -1
    }
}));
const SidebarHeader = ({ title, action, tooltipText, actionTitle }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(Grid_1.default, { container: true, direction: 'row', justify: 'space-between', alignItems: 'center', className: classes.root },
        react_1.default.createElement(Grid_1.default, { item: true }, actionTitle ? (react_1.default.createElement(Tooltip_1.default, { title: 'More channels', className: classes.tooltip, placement: 'bottom' },
            react_1.default.createElement(Typography_1.default, { variant: 'body2', className: (0, classnames_1.default)(classes.title, classes.clickable), onClick: event => {
                    event.persist();
                    actionTitle();
                } }, title))) : (react_1.default.createElement(Typography_1.default, { variant: 'body2', className: classes.title }, title))),
        react_1.default.createElement(Grid_1.default, { item: true },
            react_1.default.createElement(Tooltip_1.default, { title: tooltipText, className: classes.tooltip, placement: 'bottom' },
                react_1.default.createElement(IconButton_1.default, { className: classes.iconButton, onClick: event => {
                        event.persist();
                        action();
                    }, edge: 'end', "data-testid": 'addChannelButton' },
                    react_1.default.createElement(PlusIconWithBorder_1.default, { color: 'white' }))))));
};
exports.SidebarHeader = SidebarHeader;
exports.default = exports.SidebarHeader;
