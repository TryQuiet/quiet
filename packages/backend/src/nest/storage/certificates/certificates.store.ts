import { getCrypto } from 'pkijs'

import { EventEmitter } from 'events'
import { StorageEvents } from '../storage.types'

import EventStore from 'orbit-db-eventstore'
import OrbitDB from 'orbit-db'

import { loadCertificate, keyFromCertificate } from '@quiet/identity'

import { ConnectionProcessInfo, NoCryptoEngineError, SocketActionTypes } from '@quiet/types'

import { IsNotEmpty, IsBase64, validate } from 'class-validator'
import { ValidationError } from '@nestjs/common'

import createLogger from '../../common/logger'

const logger = createLogger('CertificatesStore')

class UserCertificateData {
    @IsNotEmpty()
    @IsBase64()
    certificate: string
}

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

    private async validateCertificate(certificate: string): Promise<boolean> {
        logger('Validating certificate')
        try {
            const crypto = getCrypto()

            if (!crypto) {
                throw new NoCryptoEngineError()
            }

            const parsedCertificate = loadCertificate(certificate)
            await parsedCertificate.verify()

            await this.validateCertificateFormat(certificate)

            // Validate

        } catch (err) {
            logger.error('Failed to validate user certificate:', certificate, err?.message)
            return false
        }

        return true
    }

    private async validateCertificateFormat(certificate: string): Promise<ValidationError[]> {
        const data = new UserCertificateData()
        data.certificate = certificate

        const validationErrors = await validate(data)

        return validationErrors
    }

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
