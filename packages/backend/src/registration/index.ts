import express from 'express'
import getPort from 'get-port'
import { Agent, Server } from 'http'
import { EventEmitter } from 'events'

import {
  LaunchRegistrarPayload,
  SocketActionTypes,
  PermsData,
  ConnectionProcessInfo
} from '@quiet/state-manager'

import logger from '../logger'
import { registerOwner, registerUser, RegistrationResponse, sendCertificateRegistrationRequest } from './functions'
import { RegistrationEvents } from './types'
import { ServiceState } from '../libp2p/types'

const log = logger('registration')

export class CertificateRegistration extends EventEmitter {
  private readonly _app: express.Application
  private _server: Server
  private _port: number
  public registrationService: any
  public certificates: string[]
  private _permsData: PermsData

  constructor() {
    super()
    this.certificates = []
    this.on(RegistrationEvents.SET_CERTIFICATES, (certs) => {
      this.setCertificates(certs)
    })
    this._app = express()
    this.setRouting()
  }

  public setCertificates(certs: string[]) {
    this.certificates = certs
  }

  private pendingPromise: Promise<{ status: number; body: any }> = null

  private setRouting() {
    // @ts-ignore
    this._app.use(express.json())
    this._app.post(
      '/register',
      async (req, res): Promise<void> => {
        if (this.pendingPromise) return
        this.pendingPromise = this.registerUser(req.body.data)
        const result = await this.pendingPromise
        if (result) {
          res.status(result.status).send(result.body)
        }
        this.pendingPromise = null
      }
    )
  }

  public async listen(): Promise<void> {
    return await new Promise(resolve => {
      this._server = this._app.listen(this._port, () => {
        log(`Certificate registration service listening on port: ${this._port}`)
        resolve()
      })
    })
  }

  public async stop(): Promise<void> {
    return await new Promise(resolve => {
      if (!this._server) resolve()
      this._server.close(() => {
        log('Certificate registration service closed')
        resolve()
      })
    })
  }

  public async registerOwnerCertificate(payload): Promise<void> {
    const cert = await registerOwner(payload.userCsr.userCsr, payload.permsData)
    this.emit(SocketActionTypes.SAVED_OWNER_CERTIFICATE, {
      communityId: payload.communityId,
      network: { certificate: cert, peers: [] }
    })
  }

  public sendCertificateRegistrationRequest = async (
    serviceAddress: string,
    userCsr: string,
    communityId: string,
    requestTimeout: number = 120000,
    socksProxyAgent: Agent
  ): Promise<void> => {
    const response: RegistrationResponse = await sendCertificateRegistrationRequest(serviceAddress,
      userCsr,
      communityId,
      requestTimeout,
      socksProxyAgent
    )
    this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.FETCHING)
    this.emit(response.eventType, response.data)
  }

  private async registerUser(csr: string): Promise<{ status: number; body: any }> {
    const result = await registerUser(csr, this._permsData, this.certificates)
    if (result?.status === 200) {
      this.emit(RegistrationEvents.NEW_USER, { certificate: result.body.certificate, rootPermsData: this._permsData })
    }
    return result
  }

  public async launchRegistrar(payload: LaunchRegistrarPayload): Promise<void> {
    this.emit(RegistrationEvents.REGISTRAR_STATE, ServiceState.LAUNCHING)
    this._permsData = {
      certificate: payload.rootCertString,
      privKey: payload.rootKeyString
    }
    log(`Initializing registration service for peer ${payload.peerId}...`)
    try {
      await this.init(payload.privateKey)
    } catch (err) {
      log.error(`Couldn't initialize certificate registration service: ${err as string}`)
      return
    }
    try {
      await this.listen()
    } catch (err) {
      log.error(`Certificate registration service couldn't start listening: ${err as string}`)
    }
    this.emit(RegistrationEvents.REGISTRAR_STATE, ServiceState.LAUNCHED)
  }

  public async init(privKey: string): Promise<void> {
    this._port = await getPort()
    this.emit(RegistrationEvents.SPAWN_HS_FOR_REGISTRAR, {
      port: this._port,
      privateKey: privKey,
      targetPort: 80
    })
  }
}
