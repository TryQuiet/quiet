"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddChannelAction = void 0;
const react_1 = __importDefault(require("react"));
const add_icon_svg_1 = __importDefault(require("../../../static/images/zcash/add-icon.svg"));
const MenuAction_1 = __importDefault(require("../../ui/MenuAction/MenuAction"));
const MenuActionItem_1 = __importDefault(require("../../ui/MenuAction/MenuActionItem"));
const AddChannelAction = ({ openCreateModal }) => {
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(MenuAction_1.default, { icon: add_icon_svg_1.default, iconHover: add_icon_svg_1.default, offset: '0 8' },
            react_1.default.createElement(MenuActionItem_1.default, { onClick: openCreateModal, title: 'Create' }))));
};
exports.AddChannelAction = AddChannelAction;
exports.default = exports.AddChannelAction;
