"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelsListItem = void 0;
const react_1 = __importDefault(require("react"));
const classnames_1 = __importDefault(require("classnames"));
const core_1 = require("@material-ui/core");
const styles_1 = require("@material-ui/core/styles");
const ListItem_1 = __importDefault(require("@material-ui/core/ListItem"));
const ListItemText_1 = __importDefault(require("@material-ui/core/ListItemText"));
const useStyles = (0, styles_1.makeStyles)(theme => ({
    root: {
        padding: 0
    },
    selected: {
        backgroundColor: theme.palette.colors.lushSky,
        '&:hover': {
            backgroundColor: theme.palette.colors.lushSky
        }
    },
    primary: {
        display: 'flex'
    },
    title: {
        opacity: 0.7,
        paddingLeft: 16,
        paddingRight: 16,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: 215,
        whiteSpace: 'nowrap',
        textTransform: 'lowercase'
    },
    newMessages: {
        opacity: 1
    },
    connectedIcon: {
        marginLeft: 16,
        marginRight: -8,
        width: 11,
        height: 11
    },
    notConnectedIcon: {
        marginLeft: 16,
        marginRight: -8,
        width: 11,
        height: 11,
        opacity: 0.5
    },
    itemText: {
        margin: 0
    }
}));
const ChannelsListItem = ({ channel, selected, setCurrentChannel }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(ListItem_1.default, { button: true, disableGutters: true, onClick: () => {
            setCurrentChannel(channel.name);
        }, className: (0, classnames_1.default)(classes.root, {
            [classes.selected]: selected
        }), "data-testid": `${channel.name}-link` },
        react_1.default.createElement(ListItemText_1.default, { primary: react_1.default.createElement(core_1.Grid, { container: true, alignItems: 'center' },
                react_1.default.createElement(core_1.Grid, { item: true }),
                react_1.default.createElement(core_1.Grid, { item: true },
                    react_1.default.createElement(core_1.Typography, { variant: 'body2', className: (0, classnames_1.default)(classes.title, {
                            // TODO
                            [classes.newMessages]: false
                        }) }, `# ${channel.name}`))), classes: {
                primary: classes.primary
            }, className: classes.itemText })));
};
exports.ChannelsListItem = ChannelsListItem;
exports.default = exports.ChannelsListItem;
