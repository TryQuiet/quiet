import { DataServer, ConnectionsManager } from 'waggle';
import { BrowserWindow } from 'electron';
export declare const getPorts: () => Promise<{
    socksPort: number;
    libp2pHiddenService: number;
    controlPort: number;
    httpTunnelPort: number;
    dataServer: number;
}>;
export declare const runWaggle: (webContents: BrowserWindow['webContents']) => Promise<{
    connectionsManager: ConnectionsManager;
    dataServer: DataServer;
}>;
export declare const waggleVersion: any;
declare const _default: {
    getPorts: () => Promise<{
        socksPort: number;
        libp2pHiddenService: number;
        controlPort: number;
        httpTunnelPort: number;
        dataServer: number;
    }>;
    runWaggle: (webContents: Electron.WebContents) => Promise<{
        connectionsManager: ConnectionsManager;
        dataServer: DataServer;
    }>;
    waggleVersion: any;
};
export default _default;
