"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketReducer = exports.socketActions = exports.socketSlice = exports.SocketState = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const nectar_1 = require("@zbayapp/nectar");
class SocketState {
    constructor() {
        this.isConnected = false;
    }
}
exports.SocketState = SocketState;
exports.socketSlice = (0, toolkit_1.createSlice)({
    initialState: Object.assign({}, new SocketState()),
    name: nectar_1.StoreKeys.Socket,
    reducers: {
        startConnection: (state, _action) => state,
        closeConnection: state => state,
        setConnected: state => {
            state.isConnected = true;
        }
    }
});
exports.socketActions = exports.socketSlice.actions;
exports.socketReducer = exports.socketSlice.reducer;
