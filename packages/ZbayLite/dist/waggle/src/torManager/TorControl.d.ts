/// <reference types="node" />
import net from 'net';
interface IOpts {
    port: number;
    host: string;
    password: string;
    cookie: string;
}
interface IParams {
    port: number;
    host: string;
}
export declare class TorControl {
    connection: net.Socket;
    password: string;
    cookie: string;
    params: IParams;
    constructor(opts: IOpts);
    private connect;
    private disconnect;
    private _sendCommand;
    sendCommand(command: string): Promise<{
        code: number;
        messages: string[];
    }>;
}
export {};
