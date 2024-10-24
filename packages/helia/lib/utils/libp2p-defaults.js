import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { createDelegatedRoutingV1HttpApiClient } from '@helia/delegated-routing-v1-http-api-client';
import { autoNAT } from '@libp2p/autonat';
import { bootstrap } from '@libp2p/bootstrap';
import { circuitRelayTransport, circuitRelayServer } from '@libp2p/circuit-relay-v2';
import { dcutr } from '@libp2p/dcutr';
import { identify, identifyPush } from '@libp2p/identify';
import { kadDHT } from '@libp2p/kad-dht';
import { keychain } from '@libp2p/keychain';
import { mdns } from '@libp2p/mdns';
import { mplex } from '@libp2p/mplex';
import { ping } from '@libp2p/ping';
import { tcp } from '@libp2p/tcp';
import { tls } from '@libp2p/tls';
import { uPnPNAT } from '@libp2p/upnp-nat';
import { webRTC, webRTCDirect } from '@libp2p/webrtc';
import { webSockets } from '@libp2p/websockets';
import { ipnsSelector } from 'ipns/selector';
import { ipnsValidator } from 'ipns/validator';
import * as libp2pInfo from 'libp2p/version';
import { name, version } from '../version.js';
import { bootstrapConfig } from './bootstrappers.js';
export function libp2pDefaults(options = {}) {
    const agentVersion = `${name}/${version} ${libp2pInfo.name}/${libp2pInfo.version} UserAgent=${process.version}`;
    return {
        privateKey: options.privateKey,
        dns: options.dns,
        addresses: {
            listen: [
                '/ip4/0.0.0.0/tcp/0',
                '/ip6/::/tcp/0',
                '/p2p-circuit',
                '/webrtc'
            ]
        },
        transports: [
            circuitRelayTransport(),
            tcp(),
            webRTC(),
            webRTCDirect(),
            webSockets()
        ],
        connectionEncrypters: [
            noise(),
            tls()
        ],
        streamMuxers: [
            yamux(),
            mplex()
        ],
        peerDiscovery: [
            mdns(),
            bootstrap(bootstrapConfig)
        ],
        services: {
            autoNAT: autoNAT(),
            dcutr: dcutr(),
            delegatedRouting: () => createDelegatedRoutingV1HttpApiClient('https://delegated-ipfs.dev', {
                filterProtocols: ['unknown', 'transport-bitswap', 'transport-ipfs-gateway-http'],
                filterAddrs: ['https', 'tcp', 'webrtc', 'webrtc-direct', 'wss']
            }),
            dht: kadDHT({
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
            ping: ping(),
            relay: circuitRelayServer(),
            upnp: uPnPNAT()
        }
    };
}
