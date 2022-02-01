"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tor = void 0;
const react_1 = __importDefault(require("react"));
const electron_1 = require("electron");
const styles_1 = require("@material-ui/core/styles");
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const TextField_1 = __importDefault(require("@material-ui/core/TextField"));
require("react-alice-carousel/lib/alice-carousel.css");
const InputAdornment_1 = __importDefault(require("@material-ui/core/InputAdornment"));
const FormControlLabel_1 = __importDefault(require("@material-ui/core/FormControlLabel"));
const Checkbox_1 = __importDefault(require("@material-ui/core/Checkbox"));
const IconButton_1 = __importDefault(require("@material-ui/core/IconButton"));
const Refresh_1 = __importDefault(require("@material-ui/icons/Refresh"));
const core_1 = require("@material-ui/core");
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    message: {
        color: theme.palette.colors.darkGray,
        fontSize: 16
    },
    error: {
        marginTop: 8,
        color: theme.palette.colors.red
    },
    addressDiv: {
        width: 286,
        marginTop: -8
    }
}));
const Tor = ({ checkDeafult, tor, setUrl, setEnabled, checkTor }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(Grid_1.default, { container: true, direction: 'column', alignItems: 'center' },
        react_1.default.createElement(Grid_1.default, { item: true },
            react_1.default.createElement(FormControlLabel_1.default, { control: react_1.default.createElement(Checkbox_1.default, { checked: tor.enabled, onChange: e => {
                        setEnabled({ enabled: e.target.checked });
                        if (e.target.checked) {
                            checkDeafult();
                        }
                    }, color: 'default' }), label: react_1.default.createElement(core_1.Typography, { variant: 'body2' }, "Connect through Tor (optional)") })),
        tor.enabled && (react_1.default.createElement(Grid_1.default, { className: classes.addressDiv, container: true, direction: 'column', justify: 'center', alignItems: 'center', item: true },
            react_1.default.createElement(Grid_1.default, { item: true },
                react_1.default.createElement(TextField_1.default, { label: 'URL of Tor proxy', value: tor.url, disabled: tor.enabled === false, onChange: e => setUrl({ url: e.target.value }), margin: 'normal', variant: 'outlined', required: true, InputProps: {
                        // TODO: Should be removed after migrating to material v4.0
                        endAdornment: (react_1.default.createElement(InputAdornment_1.default, { position: 'end', style: { padding: 0 } },
                            react_1.default.createElement(IconButton_1.default, { onClick: checkTor, disabled: tor.enabled === false },
                                react_1.default.createElement(Refresh_1.default, { fontSize: 'large' }))))
                    } })),
            react_1.default.createElement(Grid_1.default, { item: true },
                react_1.default.createElement(core_1.Typography, { variant: 'body2' },
                    "Using Tor?",
                    ' ',
                    react_1.default.createElement("a", { onClick: e => {
                            e.preventDefault();
                            void electron_1.shell.openExternal('https://zcash.readthedocs.io/en/latest/rtd_pages/tor.html');
                        }, href: '#' }, "Read this warning"))))),
        tor.error && (react_1.default.createElement(Grid_1.default, { item: true, className: classes.error },
            react_1.default.createElement(core_1.Typography, { variant: 'body2' }, tor.error)))));
};
exports.Tor = Tor;
exports.default = exports.Tor;
