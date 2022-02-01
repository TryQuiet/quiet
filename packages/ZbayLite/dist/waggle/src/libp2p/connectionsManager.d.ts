/// <reference types="node" />
import { Agent } from 'https';
import Libp2p from 'libp2p';
import Websockets from 'libp2p-websockets';
import SocketIO from 'socket.io';
import { Response } from 'node-fetch';
import PeerId from 'peer-id';
import { ConnectionsManagerOptions } from '../common/types';
import { Certificates } from '@zbayapp/nectar';
import IOProxy from '../socket/IOProxy';
import { Tor } from '../torManager';
import { EventEmitter } from 'events';
export interface IConstructor {
    host?: string;
    port?: number;
    agentPort?: number;
    agentHost?: string;
    options?: Partial<ConnectionsManagerOptions>;
    io: SocketIO.Server;
    storageClass?: any;
    httpTunnelPort?: number;
}
export interface Libp2pNodeParams {
    peerId: PeerId;
    listenAddresses: string[];
    agent: Agent;
    cert?: string;
    key?: string;
    ca?: string[];
    localAddress: string;
    bootstrapMultiaddrsList: string[];
    transportClass: Websockets;
    targetPort: number;
}
export interface InitLibp2pParams {
    peerId: PeerId;
    address: string;
    addressPort: number;
    targetPort: number;
    bootstrapMultiaddrs: string[];
    certs?: Certificates;
}
export declare class ConnectionsManager extends EventEmitter {
    agentHost: string;
    agentPort: number;
    httpTunnelPort: number;
    socksProxyAgent: any;
    options: ConnectionsManagerOptions;
    zbayDir: string;
    io: SocketIO.Server;
    ioProxy: IOProxy;
    libp2pTransportClass: any;
    StorageCls: any;
    tor: Tor;
    libp2pInstance: Libp2p;
    connectedPeers: Set<string>;
    constructor({ agentHost, agentPort, httpTunnelPort, options, storageClass, io }: IConstructor);
    readonly createAgent: () => Agent;
    readonly createLibp2pAddress: (address: string, port: number, peerId: string) => string;
    readonly createLibp2pListenAddress: (address: string, port: number) => string;
    initListeners: () => void;
    createNetwork: () => Promise<{
        hiddenService: any;
        peerId: PeerId.JSONPeerId;
    }>;
    init: () => Promise<void>;
    closeAllServices: () => Promise<void>;
    spawnTor: () => Promise<void>;
    initLibp2p: (params: InitLibp2pParams) => Promise<{
        libp2p: Libp2p;
        localAddress: string;
    }>;
    createStorage: (peerId: string, communityId: string) => any;
    sendCertificateRegistrationRequest: (serviceAddress: string, userCsr: string, requestTimeout?: number) => Promise<Response>;
    static readonly createBootstrapNode: (params: Libp2pNodeParams) => Libp2p;
    private static readonly defaultLibp2pNode;
}
