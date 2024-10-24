import { type Identify } from '@libp2p/identify';
import { type KadDHT } from '@libp2p/kad-dht';
import { type Keychain } from '@libp2p/keychain';
import { type PingService } from '@libp2p/ping';
import type { Libp2pDefaultsOptions } from './libp2p.js';
import type { Libp2pOptions } from 'libp2p';
export interface DefaultLibp2pServices extends Record<string, unknown> {
    autoNAT: unknown;
    dcutr: unknown;
    delegatedRouting: unknown;
    dht: KadDHT;
    identify: Identify;
    keychain: Keychain;
    ping: PingService;
}
export declare function libp2pDefaults(options?: Libp2pDefaultsOptions): Libp2pOptions<DefaultLibp2pServices> & Required<Pick<Libp2pOptions<DefaultLibp2pServices>, 'services'>>;
