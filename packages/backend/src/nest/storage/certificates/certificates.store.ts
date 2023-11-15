import { EventEmitter } from 'events'
import { StorageEvents } from '../storage.types'

import EventStore from 'orbit-db-eventstore'
import OrbitDB from 'orbit-db'

import { loadCertificate, keyFromCertificate } from '@quiet/identity'

import { ConnectionProcessInfo, SocketActionTypes } from '@quiet/types'

import createLogger from '../../common/logger'

const logger = createLogger('CertificatesStore')

export class CertificatesStore {
    public orbitDb: OrbitDB
    public store: EventStore<string>

    constructor(orbitDb: OrbitDB) {
        this.orbitDb = orbitDb
    }

    public async init(emitter: EventEmitter) {
        logger('Initializing certificates log store')

        this.store = await this.orbitDb.log<string>('certificates', {
            replicate: false,
            accessController: {
                write: ['*'],
            },
        })

        this.store.events.on('write', async (_address, entry) => {
            logger('Saved certificate locally')

            emitter.emit(StorageEvents.LOAD_CERTIFICATES, {
                certificates: await this.getCertificates(),
            })

            // await this.updatePeersList()
        })

        this.store.events.on('ready', async () => {
            logger('Loaded certificates to memory')

            emitter.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.LOADED_CERTIFICATES)

            emitter.emit(StorageEvents.LOAD_CERTIFICATES, {
              certificates: await this.getCertificates(),
            })
        })

        this.store.events.on('replicated', async () => {
            logger('REPLICATED: Certificates')

            emitter.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.CERTIFICATES_REPLICATED)

            emitter.emit(StorageEvents.LOAD_CERTIFICATES, {
              certificates: await this.getCertificates(),
            })

            // await this.updatePeersList()
        })

    }

    /*
     * In order to split up the work scope, we mock validating function,
     * until we move the certificates section into it's own store
     */
    private async validateCertificate(_certificate: string): Promise<boolean> {
        logger('Validating certificate')
        return true
    }

    /* 
     * Method returning store entries, filtered by validation result
     * as specified in the comment section of 
     * https://github.com/TryQuiet/quiet/issues/1899
     */
    protected async getCertificates() {
        const filteredCertificatesMap: Map<string, string> = new Map()

        const allCertificates = this.store
            .iterator({ limit: -1 })
            .collect()
            .map(e => e.payload.value)

        await Promise.all(
            allCertificates
                .filter(async certificate => {
                    const validation = await this.validateCertificate(certificate)
                    return Boolean(validation)
                }).map(async certificate => {
                    const parsedCertificate = loadCertificate(certificate)
                    const pubKey = keyFromCertificate(parsedCertificate)

                    if (filteredCertificatesMap.has(pubKey)) {
                        filteredCertificatesMap.delete(pubKey)
                    }

                    filteredCertificatesMap.set(pubKey, certificate)
                })
        )
        return [...filteredCertificatesMap.values()]
    }

}
