import SocketIO from 'socket.io';
export declare class DataServer {
    PORT: number;
    private readonly _app;
    private readonly server;
    io: SocketIO.Server;
    constructor(port?: number);
    private get cors();
    private readonly initSocket;
    listen: () => Promise<void>;
    close: () => Promise<void>;
}
