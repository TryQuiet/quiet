import type { DefaultLibp2pServices } from './libp2p-defaults.js';
import type { ComponentLogger, Libp2p, PrivateKey } from '@libp2p/interface';
import type { KeychainInit } from '@libp2p/keychain';
import type { DNS } from '@multiformats/dns';
import type { Datastore } from 'interface-datastore';
import type { Libp2pOptions } from 'libp2p';
export interface CreateLibp2pOptions<T extends Record<string, unknown>> {
    datastore: Datastore;
    libp2p?: Libp2pOptions<T>;
    logger?: ComponentLogger;
    keychain?: KeychainInit;
    start?: boolean;
}
export interface Libp2pDefaultsOptions {
    privateKey?: PrivateKey;
    keychain?: KeychainInit;
    dns?: DNS;
}
export declare function createLibp2p<T extends Record<string, unknown> = DefaultLibp2pServices>(options: CreateLibp2pOptions<T>): Promise<Libp2p<T>>;
