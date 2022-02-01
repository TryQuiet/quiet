"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextWithLink = void 0;
const react_1 = __importDefault(require("react"));
const core_1 = require("@material-ui/core");
const styles_1 = require("@material-ui/core/styles");
const useStyles = (0, styles_1.makeStyles)(theme => ({
    link: {
        textDecoration: 'none',
        color: theme.palette.colors.linkBlue
    }
}));
const TextWithLink = (_a) => {
    var { text, tagPrefix = '%', links, testIdPrefix = '' } = _a, props = __rest(_a, ["text", "tagPrefix", "links", "testIdPrefix"]);
    const classes = useStyles({});
    const format = (action, label) => {
        return (react_1.default.createElement("a", { href: '#', className: classes.link, onClick: e => {
                e.preventDefault();
                action();
            }, "data-testid": `${testIdPrefix}Link` }, label));
    };
    var parts = text.split(/(\s+)/);
    links.map(link => {
        for (var i = 1; i < parts.length; i++) {
            if (`${tagPrefix + link.tag}` === parts[i]) {
                parts[i] = format(link.action, link.label);
            }
        }
    });
    return (react_1.default.createElement(core_1.Typography, Object.assign({}, props), parts.map((e, index) => {
        return react_1.default.createElement("span", { key: index }, e);
    })));
};
exports.TextWithLink = TextWithLink;
exports.default = exports.TextWithLink;
