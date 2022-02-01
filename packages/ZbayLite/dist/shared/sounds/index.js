"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.soundTypeToAudio = exports.sharp = exports.relentless = exports.direct = void 0;
/* global Audio */
const static_1 = require("../static");
exports.direct = new Audio(require('./direct.mp3'));
exports.relentless = new Audio(require('./relentless.mp3'));
exports.sharp = new Audio(require('./sharp.mp3'));
exports.soundTypeToAudio = {
    [static_1.soundType.BANG]: exports.sharp,
    [static_1.soundType.POW]: exports.direct,
    [static_1.soundType.SPLAT]: exports.relentless
};
