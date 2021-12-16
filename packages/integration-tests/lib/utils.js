"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertNoErrors = exports.createAppWithoutTor = exports.createApp = exports.createPath = exports.createTmpDir = void 0;
const socket_io_client_1 = require("socket.io-client");
const libp2p_websockets_1 = __importDefault(require("libp2p-websockets"));
const toolkit_1 = require("@reduxjs/toolkit");
const typed_redux_saga_1 = require("typed-redux-saga");
const waggle_1 = __importDefault(require("waggle"));
const nectar_1 = require("@zbayapp/nectar");
const path_1 = __importDefault(require("path"));
const assert_1 = __importDefault(require("assert"));
const get_port_1 = __importDefault(require("get-port"));
const tmp_1 = __importDefault(require("tmp"));
const logger_1 = __importDefault(require("./logger"));
const log = (0, logger_1.default)();
const createTmpDir = (prefix) => {
    return tmp_1.default.dirSync({ mode: 0o750, prefix, unsafeCleanup: true });
};
exports.createTmpDir = createTmpDir;
const createPath = (dirName) => {
    return path_1.default.join(dirName, ".nectar");
};
exports.createPath = createPath;
const connectToDataport = (url, name) => {
    const socket = (0, socket_io_client_1.io)(url);
    socket.on("connect", async () => {
        log(`websocket connection is ready for app ${name}`);
    });
    socket.on("disconnect", () => {
        log(`socket disconnected for app ${name}`);
        socket.close();
    });
    return socket;
};
const createApp = async (mockedState) => {
    /**
     * Configure and initialize ConnectionsManager from waggle,
     * configure redux store
     */
    const appName = (Math.random() + 1).toString(36).substring(7);
    log(`Creating test app for ${appName}`);
    const dataServerPort1 = await (0, get_port_1.default)({ port: 4677 });
    const server1 = new waggle_1.default.DataServer(dataServerPort1);
    await server1.listen();
    const { store, runSaga } = (0, nectar_1.prepareStore)(mockedState);
    const proxyPort = await (0, get_port_1.default)({ port: 1234 });
    const controlPort = await (0, get_port_1.default)({ port: 5555 });
    const httpTunnelPort = await (0, get_port_1.default)({ port: 9000 });
    const manager = new waggle_1.default.ConnectionsManager({
        agentHost: "localhost",
        agentPort: proxyPort,
        httpTunnelPort,
        options: {
            env: {
                appDataPath: (0, exports.createPath)((0, exports.createTmpDir)(`zbayIntegrationTest-${appName}`).name),
            },
            torControlPort: controlPort,
        },
        io: server1.io,
    });
    await manager.init();
    function* root() {
        const socket = yield* (0, typed_redux_saga_1.call)(connectToDataport, `http://localhost:${dataServerPort1}`, appName);
        // @ts-expect-error
        const task = yield* (0, typed_redux_saga_1.fork)(nectar_1.useIO, socket);
        yield* (0, typed_redux_saga_1.take)((0, toolkit_1.createAction)("testFinished"));
        yield* (0, typed_redux_saga_1.put)(nectar_1.app.actions.closeServices());
    }
    const rootTask = runSaga(root);
    return { store, runSaga, rootTask, manager };
};
exports.createApp = createApp;
const createAppWithoutTor = async (mockedState) => {
    /**
     * Configure and initialize ConnectionsManager from waggle,
     * configure redux store
     */
    const appName = (Math.random() + 1).toString(36).substring(7);
    log(`Creating test app for ${appName}`);
    const dataServerPort1 = await (0, get_port_1.default)({ port: 4677 });
    const server1 = new waggle_1.default.DataServer(dataServerPort1);
    await server1.listen();
    const { store, runSaga } = (0, nectar_1.prepareStore)(mockedState);
    const proxyPort = await (0, get_port_1.default)({ port: 1234 });
    const controlPort = await (0, get_port_1.default)({ port: 5555 });
    const httpTunnelPort = await (0, get_port_1.default)({ port: 9000 });
    const manager = new waggle_1.default.ConnectionsManager({
        agentHost: "localhost",
        agentPort: proxyPort,
        httpTunnelPort,
        options: {
            env: {
                appDataPath: (0, exports.createPath)((0, exports.createTmpDir)(`zbayIntegrationTest-${appName}`).name),
            },
            libp2pTransportClass: libp2p_websockets_1.default,
            torControlPort: controlPort,
        },
        io: server1.io,
    });
    manager.initListeners();
    function* root() {
        const socket = yield* (0, typed_redux_saga_1.call)(connectToDataport, `http://localhost:${dataServerPort1}`, appName);
        // @ts-expect-error
        const task = yield* (0, typed_redux_saga_1.fork)(nectar_1.useIO, socket);
        yield* (0, typed_redux_saga_1.take)((0, toolkit_1.createAction)("testFinished"));
        yield* (0, typed_redux_saga_1.put)(nectar_1.app.actions.closeServices());
    }
    const rootTask = runSaga(root);
    return { store, runSaga, rootTask, manager };
};
exports.createAppWithoutTor = createAppWithoutTor;
const throwAssertionError = (action) => {
    throw new assert_1.default.AssertionError({
        message: `Nectar received error: ${JSON.stringify(action.payload)}`,
    });
};
function* assertNoErrors() {
    // Use at the beginning of test saga
    yield* (0, typed_redux_saga_1.all)([(0, typed_redux_saga_1.takeEvery)(nectar_1.errors.actions.addError, throwAssertionError)]);
}
exports.assertNoErrors = assertNoErrors;
