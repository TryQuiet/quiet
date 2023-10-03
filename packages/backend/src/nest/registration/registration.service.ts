import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import express from 'express'
import getPort from 'get-port'
import { Agent, Server } from 'http'
import { EventEmitter } from 'events'
import {
  registerOwner,
  registerUser,
  RegistrarResponse,
  RegistrationResponse,
  sendCertificateRegistrationRequest,
} from './registration.functions'
import {
  ConnectionProcessInfo,
  ErrorCodes,
  ErrorMessages,
  LaunchRegistrarPayload,
  PermsData,
  RegisterOwnerCertificatePayload,
  SocketActionTypes,
} from '@quiet/types'
import { EXPRESS_PROVIDER } from '../const'
import { RegistrationEvents } from './registration.types'
import { ServiceState } from '../connections-manager/connections-manager.types'
import Logger from '../common/logger'

@Injectable()
export class RegistrationService extends EventEmitter implements OnModuleInit {
  private readonly logger = Logger(RegistrationService.name)
  public onionAddress: string
  private _server: Server
  private _port: number
  public registrationService: any
  public certificates: string[]
  private _permsData: PermsData
  private _ownerCertificate: string

  constructor(@Inject(EXPRESS_PROVIDER) public readonly _app: express.Application) {
    super()
  }

  onModuleInit() {
    this.on(RegistrationEvents.SET_CERTIFICATES, certs => {
      this.setCertificates(certs)
    })
    // eslint-disable-next-line
    const self = this
    this.setRouting(self)
  }

  public setCertificates(certs: string[]) {
    this.certificates = certs
  }

  private pendingPromise: Promise<RegistrarResponse> | null = null

  private setRouting(self: any) {
    // @ts-ignore
    const middleware = function (req, res, next) {
      const host = req.headers['host']
      if (host !== self.onionAddress) {
        return res.status(403).send('Access denied')
      }
      next()
    }

    this._app.use(middleware)
    this._app.use(express.json())
    this._app.post('/register', async (req, res): Promise<void> => {
      if (this.pendingPromise) return
      this.pendingPromise = this.registerUser(req.body.data)
      const result = await this.pendingPromise
      if (result) {
        res.status(result.status).send(result.body)
      }
      this.pendingPromise = null
    })
  }

  public async listen(): Promise<void> {
    return await new Promise(resolve => {
      this._server = this._app.listen(this._port, () => {
        this.logger(`Certificate registration service listening on port: ${this._port}`)
        resolve()
      })
    })
  }

  public async stop(): Promise<void> {
    return await new Promise(resolve => {
      if (!this._server) resolve()
      this._server.close(() => {
        this.logger('Certificate registration service closed')
        resolve()
      })
    })
  }

  public async registerOwnerCertificate(payload: RegisterOwnerCertificatePayload): Promise<void> {
    let cert: string
    try {
      cert = await registerOwner(payload.userCsr.userCsr, payload.permsData)
    } catch (e) {
      this.logger.error(`Registering owner failed: ${e.message}`)
      this.emit(SocketActionTypes.ERROR, {
        type: SocketActionTypes.REGISTRAR,
        code: ErrorCodes.SERVER_ERROR,
        message: ErrorMessages.REGISTRATION_FAILED,
        community: payload.communityId,
      })
      return
    }
    this.emit(SocketActionTypes.SAVED_OWNER_CERTIFICATE, {
      communityId: payload.communityId,
      network: { certificate: cert, peers: [] },
    })
    this._ownerCertificate = cert
  }

  public async sendCertificateRegistrationRequest(
    serviceAddress: string,
    userCsr: string,
    communityId: string,
    requestTimeout = 120000,
    socksProxyAgent: Agent
  ): Promise<void> {
    const response: RegistrationResponse = await sendCertificateRegistrationRequest(
      serviceAddress,
      userCsr,
      communityId,
      requestTimeout,
      socksProxyAgent
    )
    this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.CONNECTING_TO_COMMUNITY)
    this.emit(response.eventType, response.data)
  }

  private async registerUser(csr: string): Promise<{ status: number; body: any }> {
    const result = await registerUser(csr, this._permsData, this.certificates, this._ownerCertificate)
    if (result?.status === 200) {
      this.emit(RegistrationEvents.NEW_USER, { certificate: result.body.certificate, rootPermsData: this._permsData })
    }
    return result
  }

  public async launchRegistrar(payload: LaunchRegistrarPayload): Promise<void> {
    this.emit(RegistrationEvents.REGISTRAR_STATE, ServiceState.LAUNCHING)
    this._permsData = {
      certificate: payload.rootCertString,
      privKey: payload.rootKeyString,
    }
    this.logger(`Initializing registration service for peer ${payload.peerId}...`)
    try {
      await this.init(payload.privateKey)
    } catch (err) {
      this.logger.error(`Couldn't initialize certificate registration service: ${err as string}`)
      return
    }
    try {
      await this.listen()
    } catch (err) {
      this.logger.error(`Certificate registration service couldn't start listening: ${err as string}`)
    }
    this.emit(RegistrationEvents.REGISTRAR_STATE, ServiceState.LAUNCHED)
  }

  public async init(privKey: string): Promise<void> {
    this._port = await getPort()
    this.emit(RegistrationEvents.SPAWN_HS_FOR_REGISTRAR, {
      port: this._port,
      privateKey: privKey,
      targetPort: 80,
    })
  }
}
