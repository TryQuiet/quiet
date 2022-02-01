"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelInputAction = void 0;
const react_1 = __importDefault(require("react"));
const plus_icon_svg_1 = __importDefault(require("../../../static/images/zcash/plus-icon.svg"));
const plus_icon_gray_svg_1 = __importDefault(require("../../../static/images/zcash/plus-icon-gray.svg"));
const MenuAction_1 = __importDefault(require("../../ui/MenuAction/MenuAction"));
const MenuActionItem_1 = __importDefault(require("../../ui/MenuAction/MenuActionItem"));
const ChannelInputAction = ({ disabled = false }) => {
    return (react_1.default.createElement(MenuAction_1.default, { icon: plus_icon_gray_svg_1.default, iconHover: plus_icon_svg_1.default, offset: '-10 12', disabled: disabled, placement: 'top-end' },
        react_1.default.createElement(MenuActionItem_1.default, { onClick: () => { }, title: 'Send money' })));
};
exports.ChannelInputAction = ChannelInputAction;
exports.default = exports.ChannelInputAction;
