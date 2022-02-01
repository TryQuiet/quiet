"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const effects_1 = require("redux-saga/effects");
const socket_saga_1 = require("./socket/socket.saga");
const socket_slice_1 = require("./socket/socket.slice");
function* root() {
    yield (0, effects_1.all)([
        (0, effects_1.takeEvery)(socket_slice_1.socketActions.startConnection.type, socket_saga_1.startConnectionSaga)
    ]);
}
exports.default = root;
