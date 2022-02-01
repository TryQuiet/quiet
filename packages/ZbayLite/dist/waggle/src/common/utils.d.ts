import SocketIO from 'socket.io';
export interface Ports {
    socksPort: number;
    libp2pHiddenService: number;
    controlPort: number;
    dataServer: number;
    httpTunnelPort: number;
}
export declare function createPaths(paths: string[]): void;
export declare function removeFilesFromDir(dirPath: string): void;
export declare function fetchAbsolute(fetch: Function): Function;
export declare const getPorts: () => Promise<Ports>;
export declare class DummyIOServer extends SocketIO.Server {
    emit(event: string, ...args: any[]): boolean;
    close(): void;
}
export declare const torBinForPlatform: (basePath?: string) => string;
export declare const torDirForPlatform: (basePath?: string) => string;
export declare const createLibp2pAddress: (address: string, port: number, peerId: string, wsType: 'ws' | 'wss') => string;
export declare const createLibp2pListenAddress: (address: string, port: number, wsType: 'ws' | 'wss') => string;
