"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockedUsers = void 0;
const react_1 = __importDefault(require("react"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const styles_1 = require("@material-ui/core/styles");
const UserListItem_1 = __importDefault(require("../channelSettings/UserListItem"));
const useStyles = (0, styles_1.makeStyles)(() => ({
    title: {},
    titleDiv: {
        marginBottom: 24
    },
    alignLabel: {
        marginTop: 3
    },
    labelDiv: {
        marginTop: 16,
        marginBottom: 50
    },
    itemName: {
        fontSize: 14
    },
    imageHostsDiv: {
        marginTop: 32
    }
}));
const BlockedUsers = ({ blockedUsers, users, unblock }) => {
    const classes = useStyles({});
    const blockedAddresses = Array.from(Object.keys(blockedUsers)).filter(address => users.find(user => user.address === address));
    return (react_1.default.createElement(Grid_1.default, { container: true, direction: 'column' },
        react_1.default.createElement(Grid_1.default, { container: true, item: true, justify: 'space-between', alignItems: 'center', className: classes.titleDiv },
            react_1.default.createElement(Grid_1.default, { item: true, className: classes.title },
                react_1.default.createElement(Typography_1.default, { variant: 'h3' }, "BlockedUsers"))),
        blockedAddresses.map(address => {
            return (react_1.default.createElement(Grid_1.default, { item: true },
                react_1.default.createElement(UserListItem_1.default, { name: users.find(user => user.address === address).nickname, actionName: 'unblock', prefix: '@', action: () => {
                        unblock(address);
                    } })));
        })));
};
exports.BlockedUsers = BlockedUsers;
exports.default = exports.BlockedUsers;
