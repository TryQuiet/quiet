"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Moderators = void 0;
const react_1 = __importDefault(require("react"));
const react_virtualized_1 = require("react-virtualized");
const rc_scrollbars_1 = require("rc-scrollbars");
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const styles_1 = require("@material-ui/core/styles");
const UserListItem_1 = __importDefault(require("./UserListItem"));
const useStyles = (0, styles_1.makeStyles)(theme => ({
    title: {},
    addModerator: {
        color: theme.palette.colors.lushSky,
        '&:hover': {
            color: theme.palette.colors.trueBlack
        },
        cursor: 'pointer'
    },
    titleDiv: {
        marginBottom: 24
    }
}));
const Moderators = ({ moderators, users, openAddModerator, removeModerator }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(react_virtualized_1.AutoSizer, null, ({ width, height }) => (react_1.default.createElement(rc_scrollbars_1.Scrollbars, { autoHideTimeout: 500, style: { width: width, height: height, overflowX: 'hidden' } },
        react_1.default.createElement(Grid_1.default, { container: true, direction: 'column' },
            react_1.default.createElement(Grid_1.default, { container: true, item: true, justify: 'space-between', alignItems: 'center', className: classes.titleDiv },
                react_1.default.createElement(Grid_1.default, { item: true, className: classes.title },
                    react_1.default.createElement(Typography_1.default, { variant: 'h3' }, "Moderators")),
                react_1.default.createElement(Grid_1.default, { item: true, className: classes.addModerator, onClick: openAddModerator },
                    react_1.default.createElement(Typography_1.default, { variant: 'body2' }, "+ Add a moderator"))),
            moderators.map(pubKey => {
                const userData = users[pubKey];
                return (react_1.default.createElement(Grid_1.default, { item: true },
                    react_1.default.createElement(UserListItem_1.default, { name: userData ? userData.username : pubKey.substring(0, 15), actionName: 'Remove', action: () => removeModerator(pubKey) })));
            }))))));
};
exports.Moderators = Moderators;
exports.default = exports.Moderators;
