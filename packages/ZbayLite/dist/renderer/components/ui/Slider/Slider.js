"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Slider = void 0;
const react_1 = __importDefault(require("react"));
const Slider_1 = __importDefault(require("@material-ui/core/Slider"));
const Typography_1 = __importDefault(require("@material-ui/core/Typography"));
const Grid_1 = __importDefault(require("@material-ui/core/Grid"));
const styles_1 = require("@material-ui/core/styles");
const SliderThumb_1 = __importDefault(require("./SliderThumb"));
const useStyles = (0, styles_1.makeStyles)((theme) => ({
    sliderContainer: {
        width: 105,
        padding: '5px 10px'
    },
    sliderRoot: {
        paddingTop: 4
    },
    label: {
        fontSize: '0.83rem'
    },
    title: {
        color: theme.typography.body2.color,
        marginBottom: 8
    },
    iconWrapper: {
        width: 18,
        height: 18
    },
    track: {
        backgroundColor: '#979797',
        height: 0.5,
        opacity: 1
    },
    thumb: {
        '&:hover': {
            boxShadow: 'none'
        },
        '&$activated': {
            boxShadow: 'none'
        }
    },
    activated: {
        boxShadow: 'none'
    }
}));
const Slider = ({ value, handleOnChange, title, minLabel, maxLabel, min, max }) => {
    const classes = useStyles({});
    return (react_1.default.createElement(Grid_1.default, { container: true, direction: "column", justify: "center", alignItems: "center" },
        react_1.default.createElement(Typography_1.default, { variant: "caption", className: classes.title }, title),
        react_1.default.createElement(Grid_1.default, { item: true },
            react_1.default.createElement(Grid_1.default, { container: true, direction: "row" },
                react_1.default.createElement(Grid_1.default, { item: true },
                    react_1.default.createElement(Typography_1.default, { variant: "body2", display: "inline", className: classes.label }, minLabel)),
                react_1.default.createElement(Grid_1.default, { item: true, xs: true, className: classes.sliderContainer },
                    react_1.default.createElement(Slider_1.default, { value: value, min: min, max: max, classes: {
                            root: classes.sliderRoot,
                            track: classes.track,
                            thumb: classes.thumb
                        }, ThumbComponent: SliderThumb_1.default, onChange: handleOnChange })),
                react_1.default.createElement(Grid_1.default, { item: true },
                    react_1.default.createElement(Typography_1.default, { variant: "body2", display: "inline", className: classes.label }, maxLabel))))));
};
exports.Slider = Slider;
exports.Slider.defaultProps = {
    minLabel: '$0',
    maxLabel: '$max',
    max: 100,
    min: 0
};
exports.default = exports.Slider;
