import { generateKeyPair } from '@libp2p/crypto/keys';
import { keychain } from '@libp2p/keychain';
import { defaultLogger } from '@libp2p/logger';
import { Key } from 'interface-datastore';
import { createLibp2p as create } from 'libp2p';
import { libp2pDefaults } from './libp2p-defaults.js';
export async function createLibp2p(options) {
    const privateKey = options.libp2p?.privateKey;
    const logger = options.logger ?? defaultLogger();
    const selfKey = new Key('/pkcs8/self');
    let chain;
    if (privateKey == null && options.datastore != null) {
        chain = keychain(options.keychain)({
            datastore: options.datastore,
            logger
        });
        options.libp2p = options.libp2p ?? {};
        if (await options.datastore.has(selfKey)) {
            options.libp2p.privateKey = await chain.exportKey('self');
        }
        else {
            const privateKey = await generateKeyPair('Ed25519');
            options.libp2p.privateKey = privateKey;
            await chain.importKey('self', privateKey);
        }
    }
    const defaults = libp2pDefaults(options);
    defaults.datastore = defaults.datastore ?? options.datastore;
    options = options ?? {};
    const node = await create({
        ...defaults,
        ...options.libp2p,
        start: false
    });
    return node;
}
