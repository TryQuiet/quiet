"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTitlebar = void 0;
const custom_electron_titlebar_1 = require("custom-electron-titlebar");
const addTitlebar = () => {
    setTimeout(() => {
        // eslint-disable-next-line
        const titlebar = new custom_electron_titlebar_1.Titlebar({
            backgroundColor: custom_electron_titlebar_1.Color.fromHex('#521c74'),
            overflow: 'hidden'
        });
    }, 0);
};
exports.addTitlebar = addTitlebar;
