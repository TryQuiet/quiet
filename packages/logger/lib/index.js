"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.consoleLogger = exports.saveToFileLogger = void 0;
const debug_1 = __importDefault(require("debug"));
const electron_log_1 = __importDefault(require("electron-log"));
const saveToFileLogger = (packageName) => (module) => {
    console.log('SAVE TO FILE LOGGER', packageName, module);
    Object.assign(console, electron_log_1.default.functions);
    return Object.assign(electron_log_1.default.scope(`${packageName}:${module}`).log, electron_log_1.default.functions, {});
};
exports.saveToFileLogger = saveToFileLogger;
const consoleLogger = (packageName) => (module) => {
    console.log('CONSOLE LOGGER', packageName, module);
    return Object.assign((0, debug_1.default)(`${packageName}:${module}`), {
        error: (0, debug_1.default)(`${packageName}:${module}:err`)
    });
};
exports.consoleLogger = consoleLogger;
const logger = (packageName) => {
    console.log('LOGGER MAIN', packageName, process.env.NODE_ENV, process.env.REACT_APP_ENABLE_SENTRY);
    if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_ENABLE_SENTRY === 'true') {
        // if (process.env.SAVE_LOGS) {
        return (0, exports.saveToFileLogger)(packageName);
    }
    return (0, exports.consoleLogger)(packageName);
};
// console.log('WHAT IS logger in logger?:', logger)
// export {logger as handleLogger}
// const logger = (name) => {
//   console.log('THIS IS LOGGER', name)
// }
// const nectarLogger = logger('nectar')
// const nectarLogger = Object.assign(debug(`${'nectar'}:${module}`), {
//   error: debug(`${'nectar'}:${module}:err`)
// })
// export { nectarLogger }
exports.default = logger;
