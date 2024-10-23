import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { createDelegatedRoutingV1HttpApiClient } from '@helia/delegated-routing-v1-http-api-client';
import { autoNAT } from '@libp2p/autonat';
import { bootstrap } from '@libp2p/bootstrap';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
import { dcutr } from '@libp2p/dcutr';
import { identify, identifyPush } from '@libp2p/identify';
import { kadDHT } from '@libp2p/kad-dht';
import { keychain } from '@libp2p/keychain';
import { mplex } from '@libp2p/mplex';
import { ping } from '@libp2p/ping';
import { webRTC, webRTCDirect } from '@libp2p/webrtc';
import { webSockets } from '@libp2p/websockets';
import { webTransport } from '@libp2p/webtransport';
import { ipnsSelector } from 'ipns/selector';
import { ipnsValidator } from 'ipns/validator';
import * as libp2pInfo from 'libp2p/version';
import { name, version } from '../version.js';
import { bootstrapConfig } from './bootstrappers.js';
export function libp2pDefaults(options = {}) {
    const agentVersion = `${name}/${version} ${libp2pInfo.name}/${libp2pInfo.version} UserAgent=${globalThis.navigator.userAgent}`;
    return {
        privateKey: options.privateKey,
        dns: options.dns,
        addresses: {
            listen: [
                '/p2p-circuit',
                '/webrtc'
            ]
        },
        transports: [
            circuitRelayTransport(),
            webRTC(),
            webRTCDirect(),
            webTransport(),
            webSockets()
        ],
        connectionEncrypters: [
            noise()
        ],
        streamMuxers: [
            yamux(),
            mplex()
        ],
        peerDiscovery: [
            bootstrap(bootstrapConfig)
        ],
        services: {
            autoNAT: autoNAT(),
            dcutr: dcutr(),
            delegatedRouting: () => createDelegatedRoutingV1HttpApiClient('https://delegated-ipfs.dev', {
                filterProtocols: ['unknown', 'transport-bitswap', 'transport-ipfs-gateway-http'],
                filterAddrs: ['https', 'webtransport', 'webrtc', 'webrtc-direct', 'wss']
            }),
            dht: kadDHT({
                clientMode: true,
                validators: {
                    ipns: ipnsValidator
                },
                selectors: {
                    ipns: ipnsSelector
                }
            }),
            identify: identify({
                agentVersion
            }),
            identifyPush: identifyPush({
                agentVersion
            }),
            keychain: keychain(options.keychain),
            ping: ping()
        }
    };
}
