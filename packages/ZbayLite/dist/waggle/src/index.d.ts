import { Tor } from './torManager';
import { DataServer } from './socket/DataServer';
import { ConnectionsManager } from './libp2p/connectionsManager';
export { DataServer } from './socket/DataServer';
export { ConnectionsManager } from './libp2p/connectionsManager';
declare const _default: {
    Tor: typeof Tor;
    DataServer: typeof DataServer;
    ConnectionsManager: typeof ConnectionsManager;
    initListeners: (io: import("socket.io").Server, ioProxy: import("./socket/IOProxy").default) => void;
    version: any;
};
export default _default;
