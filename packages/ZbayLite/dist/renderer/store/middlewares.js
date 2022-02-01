"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorsMiddleware = void 0;
const hooks_1 = require("../containers/hooks");
const modals_types_1 = require("../sagas/modals/modals.types");
const criticalError_1 = __importDefault(require("./handlers/criticalError"));
const isPromise = value => value !== null && typeof value === 'object' && typeof value.then === 'function';
const _dispatchError = (store, err) => {
    const criticalError = {
        message: err.message,
        traceback: err.stack
    };
    store.dispatch(criticalError_1.default.actions.setCriticalError(criticalError));
    const modal = (0, hooks_1.useModal)(modals_types_1.ModalName.criticalError);
    modal.handleOpen();
};
const errorsMiddleware = store => next => action => {
    var _a;
    if (!action)
        return;
    if ((_a = action === null || action === void 0 ? void 0 : action.meta) === null || _a === void 0 ? void 0 : _a.ignoreError) {
        return next(action);
    }
    // Handle action with Promise payload
    if (isPromise(action === null || action === void 0 ? void 0 : action.payload)) {
        return next(action).catch(error => {
            _dispatchError(store, error);
            throw error;
        });
    }
    else {
        let result;
        // Handle throws from regular actions
        try {
            result = next(action);
            // If next didn't throw check if the action is an async thunk and add error handling
            if (isPromise(result)) {
                result.catch(error => {
                    _dispatchError(store, error);
                    throw error;
                });
            }
        }
        catch (err) {
            _dispatchError(store, err);
            throw err;
        }
        // If no errors simply return result of action
        return result;
    }
};
exports.errorsMiddleware = errorsMiddleware;
