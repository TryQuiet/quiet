"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockedUsers = void 0;
const react_1 = __importDefault(require("react"));
const react_virtualized_1 = require("react-virtualized");
const rc_scrollbars_1 = require("rc-scrollbars");
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const styles_1 = require("@material-ui/core/styles");
const UserListItem_1 = __importDefault(require("./UserListItem"));
const useStyles = (0, styles_1.makeStyles)(() => ({
    title: {
        marginBottom: 24
    }
}));
const BlockedUsers = ({ blockedUsers, unblockUser, users }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(react_virtualized_1.AutoSizer, null, ({ width, height }) => (react_1.default.createElement(rc_scrollbars_1.Scrollbars, { autoHideTimeout: 500, style: { width: width, height: height, overflowX: 'hidden' } },
        react_1.default.createElement(Grid_1.default, { container: true, direction: 'column' },
            react_1.default.createElement(Grid_1.default, { item: true, className: classes.title },
                react_1.default.createElement(Typography_1.default, { variant: 'h3' }, "Blocked users")),
            blockedUsers.map(pubKey => {
                const userData = users[pubKey];
                return (react_1.default.createElement(Grid_1.default, { item: true, key: pubKey },
                    react_1.default.createElement(UserListItem_1.default, { name: userData ? userData.nickname : pubKey.substring(0, 15), actionName: 'Unblock', action: () => unblockUser(pubKey) })));
            }))))));
};
exports.BlockedUsers = BlockedUsers;
exports.default = exports.BlockedUsers;
