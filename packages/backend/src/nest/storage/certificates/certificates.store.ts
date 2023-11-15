import { EventEmitter } from 'events'
import { StorageEvents } from '../storage.types'

import EventStore from 'orbit-db-eventstore'
import OrbitDB from 'orbit-db'

import { keyFromCertificate, CertFieldsTypes, parseCertificate, getReqFieldValue, getCertFieldValue } from '@quiet/identity'

import { ConnectionProcessInfo, SocketActionTypes, UserData } from '@quiet/types'

import createLogger from '../../common/logger'

const logger = createLogger('CertificatesStore')

export class CertificatesStore {
    public orbitDb: OrbitDB
    public store: EventStore<string>

    private filteredCertificatesMapping: Map<string, Partial<UserData>>
    private usernameMapping: Map<string, string>

    constructor(orbitDb: OrbitDB) {
        this.orbitDb = orbitDb
        this.filteredCertificatesMapping = new Map()
    }

    public async init(emitter: EventEmitter) {
        logger('Initializing certificates log store')

        this.store = await this.orbitDb.log<string>('certificates', {
            replicate: false,
            accessController: {
                write: ['*'],
            },
        })

        this.store.events.on('ready', async () => {
            logger('Loaded certificates to memory')
            emitter.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.LOADED_CERTIFICATES)
        })

        this.store.events.on('write', async () => {
            logger('Saved certificate locally')
            await loadedCertificates()
        })

        this.store.events.on('replicated', async () => {
            logger('REPLICATED: Certificates')
            emitter.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.CERTIFICATES_REPLICATED)
            await loadedCertificates()
        })

        const loadedCertificates = async () => {
            emitter.emit(StorageEvents.LOADED_CERTIFICATES, {
                certificates: await this.getCertificates(),
            })
        }
    }

    public async close() {
        await this.store?.close()
    }

    public getAddress() {
        return this.store?.address
    }

    public async addCertificate(certificate: string) {
        logger('Adding user certificate')
        await this.store.add(certificate)
        return true
    }

    public async loadAllCertificates() {
        return this.getCertificates()
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
        
        const allCertificates = this.store
            .iterator({ limit: -1 })
            .collect()
            .map(e => e.payload.value)

        const validCertificates = allCertificates.map(async (certificate) => {
            if (this.filteredCertificatesMapping.has(certificate)) {
                return certificate // Only validate certificates
            }

            const validation = await this.validateCertificate(certificate)
            if (validation) {

                const parsedCertificate = parseCertificate(certificate)
                const pubkey = keyFromCertificate(parsedCertificate)

                const username = getCertFieldValue(parsedCertificate, CertFieldsTypes.nickName)

                // @ts-expect-error
                this.usernameMapping.set(pubkey, username)

                const data: Partial<UserData> =  {
                    // @ts-expect-error
                    username: username
                }
                
                this.filteredCertificatesMapping.set(certificate, data)

                return certificate
            }
        })

        return validCertificates.filter(i => Boolean(i)) // Filter out undefineds
    }

    public getCertificateUsername(pubkey: string) {
        return this.usernameMapping.get(pubkey)
    }

}
