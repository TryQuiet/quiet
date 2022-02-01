"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MentionElement = void 0;
const react_1 = __importDefault(require("react"));
const classnames_1 = __importDefault(require("classnames"));
const react_jdenticon_1 = __importDefault(require("react-jdenticon"));
const styles_1 = require("@material-ui/core/styles");
const core_1 = require("@material-ui/core");
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    root: {
        paddingTop: 10,
        paddingLeft: 16
    },
    avatarDiv: {
        maxHeight: 18,
        maxWidth: 18,
        borderRadius: 4,
        backgroundColor: theme.palette.colors.grayBackgroud
    },
    alignAvatar: {
        width: 17,
        height: 17,
        marginLeft: 1,
        marginTop: 1
    },
    data: {
        marginLeft: 9
    },
    highlight: {
        backgroundColor: theme.palette.colors.lushSky,
        color: theme.palette.colors.white
    },
    name: {
        marginTop: -4
    },
    caption: {
        lineHeight: '18px',
        fontSize: 12,
        letterSpacing: 0.4,
        color: 'rgba(0,0,0,0.6)'
    },
    captionHighlight: {
        color: 'rgba(255,255,255,0.6)'
    }
}));
const MentionElement = ({ name, channelName, participant = false, highlight = false, onMouseEnter, onClick }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(core_1.Grid, { container: true, className: (0, classnames_1.default)({
            [classes.root]: true,
            [classes.highlight]: highlight
        }), onMouseEnter: onMouseEnter, onClick: e => onClick(e) },
        react_1.default.createElement(core_1.Grid, { item: true, className: classes.avatarDiv },
            react_1.default.createElement("div", { className: classes.alignAvatar },
                react_1.default.createElement(react_jdenticon_1.default, { size: '17', value: name }))),
        react_1.default.createElement(core_1.Grid, { item: true, xs: true, className: classes.data },
            react_1.default.createElement(core_1.Typography, { variant: 'h5', className: classes.name }, name),
            participant && (react_1.default.createElement(core_1.Typography, { variant: 'body2', className: (0, classnames_1.default)({
                    [classes.caption]: true,
                    [classes.captionHighlight]: highlight
                }) }, `Participant in ${channelName}`)))));
};
exports.MentionElement = MentionElement;
exports.default = exports.MentionElement;
