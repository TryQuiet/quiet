import express from 'express'
import fetch, { Response } from 'node-fetch'
import getPort from 'get-port'
import { Agent, Server } from 'http'
import { EventEmitter } from 'events'
import AbortController from 'abort-controller'

import {
  LaunchRegistrarPayload,
  SocketActionTypes,
  PermsData,
  ErrorCodes,
  ErrorMessages
} from '@quiet/state-manager'

import logger from '../logger'
import { registerOwner, registerUser } from './functions'
import { RegistrationEvents } from './types'

const log = logger('registration')

export class CertificateRegistration extends EventEmitter {
  private readonly _app: express.Application
  private _server: Server
  private _port: number
  private _onionAddress: string
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
    this._onionAddress = null
    this.setRouting()
  }

  public setCertificates(certs: string[]) {
    this.certificates = certs
  }

  private pendingPromise: Promise<{ status: number; body: any }> = null

  private setRouting() {
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
        log(`Certificate registration service listening on ${this._onionAddress}:${this._port}`)
        resolve()
      })
    })
  }

  public async stop(): Promise<void> {
    return await new Promise(resolve => {
      if (!this._server) return
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
  ): Promise<Response> => {
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
    }, requestTimeout)

    let options = {
      method: 'POST',
      body: JSON.stringify({ data: userCsr }),
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    }

    options = Object.assign({
      agent: socksProxyAgent
    }, options)

    let response = null

    try {
      const start = new Date()
      response = await fetch(`${serviceAddress}/register`, options)
      const end = new Date()
      const fetchTime = (end.getTime() - start.getTime()) / 1000
      log(`Fetched ${serviceAddress}, time: ${fetchTime}`)
    } catch (e) {
      log.error(e)
      this.emit(RegistrationEvents.ERROR, {
        type: SocketActionTypes.REGISTRAR,
        code: ErrorCodes.NOT_FOUND,
        message: ErrorMessages.REGISTRAR_NOT_FOUND,
        community: communityId
      })
    } finally {
      clearTimeout(timeout)
    }

    switch (response?.status) {
      case 200:
        break
      case 400:
        this.emit(RegistrationEvents.ERROR, {
          type: SocketActionTypes.REGISTRAR,
          code: ErrorCodes.BAD_REQUEST,
          message: ErrorMessages.INVALID_USERNAME,
          community: communityId
        })
        return
      case 403:
        this.emit(RegistrationEvents.ERROR, {
          type: SocketActionTypes.REGISTRAR,
          code: ErrorCodes.FORBIDDEN,
          message: ErrorMessages.USERNAME_TAKEN,
          community: communityId
        })
        return
      case 404:
        this.emit(RegistrationEvents.ERROR, {
          type: SocketActionTypes.REGISTRAR,
          code: ErrorCodes.NOT_FOUND,
          message: ErrorMessages.REGISTRAR_NOT_FOUND,
          community: communityId
        })
        return
      default:
        log.error(
          `Registrar responded with ${response?.status} "${response?.statusText}" (${communityId})`
        )
        this.emit(RegistrationEvents.ERROR, {
          type: SocketActionTypes.REGISTRAR,
          code: ErrorCodes.SERVER_ERROR,
          message: ErrorMessages.REGISTRATION_FAILED,
          community: communityId
        })
        return
    }

    const registrarResponse: { certificate: string; peers: string[]; rootCa: string } =
      await response.json()

    log(`Sending user certificate (${communityId})`)
    this.emit(SocketActionTypes.SEND_USER_CERTIFICATE, {
      communityId: communityId,
      payload: registrarResponse
    })
  }

  private async registerUser(csr: string): Promise<{ status: number; body: any }> {
    const result = await registerUser(csr, this._permsData, this.certificates)
    if (result?.status === 200) {
      this.emit(RegistrationEvents.NEW_USER, { certificate: result.body.certificate, rootPermsData: this._permsData })
    }
    return result
  }

  public async launchRegistrar(payload: LaunchRegistrarPayload): Promise<void> {
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
