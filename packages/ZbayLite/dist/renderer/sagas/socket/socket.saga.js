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
Object.defineProperty(exports, "__esModule", { value: true });
exports.connect = exports.startConnectionSaga = void 0;
const socket_io_client_1 = require("socket.io-client");
const typed_redux_saga_1 = require("typed-redux-saga");
const nectar_1 = require("@zbayapp/nectar");
const socket_slice_1 = require("./socket.slice");
const socket_selectors_1 = require("./socket.selectors");
const redux_saga_1 = require("redux-saga");
function* startConnectionSaga(action) {
    const isConnected = yield* (0, typed_redux_saga_1.select)(socket_selectors_1.socketSelectors.isConnected);
    if (isConnected)
        return;
    const socket = yield* (0, typed_redux_saga_1.call)(exports.connect, action.payload.dataPort);
    const task = yield* (0, typed_redux_saga_1.fork)(nectar_1.socket.useIO, socket);
    yield* (0, typed_redux_saga_1.put)(socket_slice_1.socketActions.setConnected());
    // Detach sagas and close websocket connection on reload
    yield* (0, typed_redux_saga_1.fork)(handleSocketLifecycleActions, socket);
    yield* (0, typed_redux_saga_1.takeEvery)(socket_slice_1.socketActions.closeConnection, cancelRootTaskSaga, task);
}
exports.startConnectionSaga = startConnectionSaga;
const connect = (dataPort) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('starting websocket connection');
    const socket = (0, socket_io_client_1.io)(`http://localhost:${dataPort}`);
    return yield new Promise(resolve => {
        socket.on('connect', () => __awaiter(void 0, void 0, void 0, function* () {
            console.log('websocket connected');
            resolve(socket);
        }));
    });
});
exports.connect = connect;
function* handleSocketLifecycleActions(socket) {
    const socketChannel = yield* (0, typed_redux_saga_1.call)(subscribeSocketLifecycle, socket);
    yield (0, typed_redux_saga_1.takeEvery)(socketChannel, function* (action) {
        yield (0, typed_redux_saga_1.put)(action);
    });
}
function subscribeSocketLifecycle(socket) {
    return (0, redux_saga_1.eventChannel)(emit => {
        socket.on('disconnect', () => {
            console.log('closing socket connection');
            socket.close();
            emit(socket_slice_1.socketActions.closeConnection());
        });
        return () => { };
    });
}
function* cancelRootTaskSaga(task) {
    console.log('canceling root task');
    yield* (0, typed_redux_saga_1.cancel)(task);
}
