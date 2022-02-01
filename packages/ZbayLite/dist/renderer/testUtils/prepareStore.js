"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareStore = exports.reducers = void 0;
const nectar_1 = require("@zbayapp/nectar");
const store_keys_1 = require("../store/store.keys");
const redux_1 = require("redux");
const redux_saga_1 = __importDefault(require("redux-saga"));
const redux_thunk_1 = __importDefault(require("redux-thunk"));
const index_saga_1 = __importDefault(require("../sagas/index.saga"));
const app_1 = require("../store/handlers/app");
const notificationCenter_1 = require("../store/handlers/notificationCenter");
const socket_slice_1 = require("../sagas/socket/socket.slice");
const modals_slice_1 = require("../sagas/modals/modals.slice");
const typed_redux_saga_1 = require("typed-redux-saga");
exports.reducers = {
    [nectar_1.StoreKeys.Communities]: nectar_1.communities.reducer,
    [nectar_1.StoreKeys.Identity]: nectar_1.identity.reducer,
    [nectar_1.StoreKeys.Users]: nectar_1.users.reducer,
    [nectar_1.StoreKeys.Errors]: nectar_1.errors.reducer,
    [nectar_1.StoreKeys.Messages]: nectar_1.messages.reducer,
    [nectar_1.StoreKeys.PublicChannels]: nectar_1.publicChannels.reducer,
    [nectar_1.StoreKeys.Connection]: nectar_1.connection.reducer,
    [store_keys_1.StoreKeys.App]: app_1.reducer,
    [store_keys_1.StoreKeys.Socket]: socket_slice_1.socketReducer,
    [store_keys_1.StoreKeys.Modals]: modals_slice_1.modalsReducer,
    [store_keys_1.StoreKeys.NotificationCenter]: notificationCenter_1.reducer
};
const prepareStore = (mockedState, mockedSocket) => __awaiter(void 0, void 0, void 0, function* () {
    const combinedReducers = (0, redux_1.combineReducers)(exports.reducers);
    const sagaMiddleware = (0, redux_saga_1.default)();
    const store = (0, redux_1.createStore)(combinedReducers, mockedState, (0, redux_1.applyMiddleware)(...[sagaMiddleware, redux_thunk_1.default]));
    // Fork Nectar's sagas (require mocked socket.io-client)
    if (mockedSocket) {
        sagaMiddleware.run(index_saga_1.default);
        // Mock socket connected event
        yield sagaMiddleware.run(mockSocketConnectionSaga, mockedSocket).toPromise();
    }
    return {
        store,
        runSaga: sagaMiddleware.run
    };
});
exports.prepareStore = prepareStore;
function* mockSocketConnectionSaga(socket) {
    yield* (0, typed_redux_saga_1.fork)(function* () {
        yield* (0, typed_redux_saga_1.delay)(1000);
        yield* (0, typed_redux_saga_1.call)(() => {
            socket.socketClient.emit('connect');
        });
    });
    yield* (0, typed_redux_saga_1.put)(socket_slice_1.socketActions.startConnection({ dataPort: 4677 }));
}
