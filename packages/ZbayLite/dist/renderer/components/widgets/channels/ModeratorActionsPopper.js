"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModeratorActionsPopper = void 0;
const react_1 = __importDefault(require("react"));
const core_1 = require("@material-ui/core");
const Icon_1 = __importDefault(require("../../ui/Icon/Icon"));
const userIcon_svg_1 = __importDefault(require("../../../static/images/userIcon.svg"));
const banIcon_svg_1 = __importDefault(require("../../../static/images/banIcon.svg"));
const useStyles = (0, core_1.makeStyles)((theme) => ({
    root: {
        width: 320,
        height: 150,
        borderRadius: 8,
        backgroundColor: theme.palette.colors.white,
        boxShadow: '0px 2px 25px rgba(0, 0, 0, 0.2)'
    },
    username: {
        lineHeight: '26px',
        fontWeight: 500,
        marginBottom: -3
    },
    user: {
        marginTop: 10,
        marginRight: 12
    },
    address: {
        color: theme.palette.colors.captionPurple,
        lineHeight: '18px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: 230,
        whiteSpace: 'nowrap',
        display: 'inline-block'
    },
    info: {
        padding: 10,
        height: 60,
        borderBottom: '1px solid #DBDBDB'
    },
    action: {},
    actions: {
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 14
    },
    removeIcon: {
        marginRight: 10,
        marginTop: 5
    },
    banIcon: {
        marginRight: 6,
        marginTop: 4
    },
    banDiv: { marginTop: 9, cursor: 'pointer' },
    pointer: {
        cursor: 'pointer'
    }
}));
const ModeratorActionsPopper = ({ name, address, open, anchorEl, banUser }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(core_1.Popper, { open: open, anchorEl: anchorEl, transition: true },
        ({ TransitionProps }) => (react_1.default.createElement(core_1.Fade, Object.assign({}, TransitionProps, { timeout: 350 }),
            react_1.default.createElement(core_1.Paper, null,
                react_1.default.createElement(core_1.Typography, null, "The content of the Popper.")))),
        react_1.default.createElement(core_1.Grid, { container: true, direction: 'column', className: classes.root },
            react_1.default.createElement(core_1.Grid, { item: true, container: true, direction: 'row', className: classes.info, spacing: 0 },
                react_1.default.createElement(core_1.Grid, { item: true },
                    react_1.default.createElement(Icon_1.default, { className: classes.user, src: userIcon_svg_1.default })),
                react_1.default.createElement(core_1.Grid, { item: true },
                    react_1.default.createElement(core_1.Grid, { item: true, xs: 12 },
                        react_1.default.createElement(core_1.Typography, { variant: 'h5', className: classes.username }, name)),
                    react_1.default.createElement(core_1.Grid, { item: true, xs: 12 },
                        react_1.default.createElement(core_1.Typography, { variant: 'caption', className: classes.address }, address)))),
            react_1.default.createElement(core_1.Grid, { item: true, container: true, direction: 'column', justify: 'space-between', alignItems: 'center', className: classes.actions },
                react_1.default.createElement(core_1.Grid, { item: true, container: true, onClick: () => {
                        banUser();
                    }, className: classes.banDiv },
                    react_1.default.createElement(core_1.Grid, { item: true },
                        react_1.default.createElement(Icon_1.default, { className: classes.banIcon, src: banIcon_svg_1.default })),
                    react_1.default.createElement(core_1.Grid, { item: true, xs: true },
                        react_1.default.createElement(core_1.Typography, { variant: 'body1', className: classes.action }, "Silence user")))))));
};
exports.ModeratorActionsPopper = ModeratorActionsPopper;
exports.default = exports.ModeratorActionsPopper;
