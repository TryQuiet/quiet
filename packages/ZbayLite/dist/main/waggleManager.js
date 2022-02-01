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
exports.waggleVersion = exports.runWaggle = exports.getPorts = void 0;
const waggle_1 = __importDefault(require("waggle"));
const electronStore_1 = __importDefault(require("../shared/electronStore"));
const get_port_1 = __importDefault(require("get-port"));
const getPorts = () => __awaiter(void 0, void 0, void 0, function* () {
    const controlPort = yield (0, get_port_1.default)();
    const httpTunnelPort = yield (0, get_port_1.default)();
    const socksPort = yield (0, get_port_1.default)();
    const libp2pHiddenService = yield (0, get_port_1.default)();
    const dataServer = yield (0, get_port_1.default)();
    return {
        socksPort,
        libp2pHiddenService,
        controlPort,
        httpTunnelPort,
        dataServer
    };
});
exports.getPorts = getPorts;
const runWaggle = (webContents) => __awaiter(void 0, void 0, void 0, function* () {
    const ports = yield (0, exports.getPorts)();
    const appDataPath = electronStore_1.default.get('appDataPath');
    const dataServer = new waggle_1.default.DataServer(ports.dataServer);
    yield dataServer.listen();
    const isDev = process.env.NODE_ENV === 'development';
    const resourcesPath = isDev ? null : process.resourcesPath;
    const connectionsManager = new waggle_1.default.ConnectionsManager({
        port: ports.libp2pHiddenService,
        agentHost: 'localhost',
        agentPort: ports.socksPort,
        httpTunnelPort: ports.httpTunnelPort,
        io: dataServer.io,
        options: {
            env: {
                appDataPath: `${appDataPath}/Zbay`,
                resourcesPath
            },
            spawnTor: true,
            torControlPort: ports.controlPort
        }
    });
    yield connectionsManager.init();
    webContents.send('connectToWebsocket', { dataPort: ports.dataServer });
    return { connectionsManager, dataServer };
});
exports.runWaggle = runWaggle;
exports.waggleVersion = waggle_1.default.version;
exports.default = { getPorts: exports.getPorts, runWaggle: exports.runWaggle, waggleVersion: exports.waggleVersion };
