"use strict";
exports.__esModule = true;
exports.sleep = void 0;
exports.sleep = function (time) {
    if (time === void 0) { time = 1000; }
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve();
        }, time);
    });
};
