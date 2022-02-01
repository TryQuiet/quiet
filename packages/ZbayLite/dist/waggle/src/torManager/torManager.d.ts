/// <reference types="node" />
import * as child_process from 'child_process';
import { TorControl } from './TorControl';
interface IService {
    virtPort: number;
    address: string;
}
interface IConstructor {
    torPath: string;
    options: child_process.SpawnOptionsWithoutStdio;
    appDataPath: string;
    controlPort: number;
    socksPort: number;
    httpTunnelPort?: number;
    torPassword?: string;
    torAuthCookie?: string;
}
export declare class Tor {
    process: child_process.ChildProcessWithoutNullStreams | any;
    torPath: string;
    options?: child_process.SpawnOptionsWithoutStdio;
    services: Map<number, IService>;
    torControl: TorControl;
    appDataPath: string;
    controlPort: number;
    torDataDirectory: string;
    torPidPath: string;
    socksPort: string;
    httpTunnelPort: string;
    torPassword: string;
    torHashedPassword: string;
    torAuthCookie: string;
    constructor({ torPath, options, appDataPath, controlPort, socksPort, httpTunnelPort, torPassword, torAuthCookie }: IConstructor);
    init: ({ repeat, timeout }?: {
        repeat?: number;
        timeout?: number;
    }) => Promise<void>;
    initTorControl: () => void;
    private readonly torProcessNameCommand;
    protected readonly spawnTor: (timeoutMs: any) => Promise<void>;
    spawnHiddenService({ virtPort, targetPort, privKey }: {
        virtPort: number;
        targetPort: number;
        privKey: string;
    }): Promise<string>;
    destroyHiddenService(serviceId: string): Promise<boolean>;
    createNewHiddenService(virtPort: number, targetPort: number): Promise<{
        onionAddress: string;
        privateKey: string;
    }>;
    generateHashedPassword: () => void;
    getServiceAddress: (port: number) => string;
    kill: () => Promise<void>;
}
export {};
