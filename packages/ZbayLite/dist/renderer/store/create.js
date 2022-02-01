"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redux_1 = require("redux");
const redux_thunk_1 = __importDefault(require("redux-thunk"));
const redux_promise_middleware_1 = __importDefault(require("redux-promise-middleware"));
const redux_debounced_1 = __importDefault(require("redux-debounced"));
const redux_saga_1 = __importDefault(require("redux-saga"));
const index_saga_1 = __importDefault(require("../sagas/index.saga"));
const redux_devtools_extension_1 = require("redux-devtools-extension");
const reducers_1 = __importDefault(require("./reducers"));
const middlewares_1 = require("./middlewares");
const sagaMiddleware = (0, redux_saga_1.default)();
exports.default = (initialState = {}) => {
    const store = (0, redux_1.createStore)(reducers_1.default, initialState, (0, redux_devtools_extension_1.composeWithDevTools)((0, redux_1.applyMiddleware)(...[middlewares_1.errorsMiddleware, (0, redux_debounced_1.default)(), sagaMiddleware, redux_thunk_1.default, (0, redux_promise_middleware_1.default)()])));
    sagaMiddleware.run(index_saga_1.default);
    return store;
};
