import EventStore from 'orbit-db-eventstore';
import { ChannelMessage, PublicChannel } from '@zbayapp/nectar';
export interface PublicChannelsRepo {
    db: EventStore<ChannelMessage>;
    eventsAttached: boolean;
}
export interface DirectMessagesRepo {
    db: EventStore<string>;
    eventsAttached: boolean;
}
export interface ChannelInfoResponse {
    [name: string]: PublicChannel;
}
export declare class StorageOptions {
    orbitDbDir?: string;
    ipfsDir?: string;
    createPaths: boolean;
    isEntryNode?: boolean;
}
export interface IPublicKey {
    halfKey: string;
}
export declare type IMessageThread = string;
export declare class ConnectionsManagerOptions {
    env: {
        appDataPath?: string;
        resourcesPath?: string;
    };
    bootstrapMultiaddrs?: string[];
    createPaths?: boolean;
    isEntryNode?: boolean;
    createSnapshot?: boolean;
    useSnapshot?: boolean;
    libp2pTransportClass?: any;
    spawnTor?: boolean;
    torControlPort: number;
    torPassword?: string;
    torAuthCookie?: string;
    useLocalTorFiles?: boolean;
    wsType?: 'wss' | 'ws';
}
export interface IConstructor {
    host: string;
    port: number;
    agentPort?: number;
    httpTunnelPort?: number;
    agentHost?: string;
    options?: Partial<ConnectionsManagerOptions>;
    io: any;
    storageClass?: any;
}
export interface ILibp2pStatus {
    address: string;
    peerId: string;
}
