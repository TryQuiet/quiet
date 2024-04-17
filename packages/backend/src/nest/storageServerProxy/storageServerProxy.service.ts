import { Injectable } from '@nestjs/common'
import EventEmitter from 'events'
import { ServerStoredCommunityMetadata } from './storageServerProxy.types'
import fetchRetry, { RequestInitWithRetry } from 'fetch-retry'
import Logger from '../common/logger'
import { isServerStoredMetadata } from '../validation/validators'

class HTTPResponseError extends Error {
  response: Response
  constructor(message: string, response: Response) {
    super(`${message}: ${response.status} ${response.statusText}`)
    this.response = response
  }
}

@Injectable()
export class ServerProxyService extends EventEmitter {
  DEFAULT_FETCH_RETRIES = 5
  private readonly logger = Logger(ServerProxyService.name)
  _serverAddress: string
  fetch: any
  fetchConfig: RequestInitWithRetry<typeof fetch>

  constructor() {
    super()
    this.fetch = fetchRetry(global.fetch)
    this.fetchConfig = {
      retries: this.DEFAULT_FETCH_RETRIES,
      retryDelay: (attempt: number, _error: Error | null, _response: Response | null) => {
        this.logger(`Retrying request ${attempt}/${this.DEFAULT_FETCH_RETRIES}`)
        return Math.pow(2, attempt) * 1000
      },
    }
  }

  get serverAddress() {
    if (!this._serverAddress) throw new Error('Server address is required')
    return this._serverAddress
  }

  setServerAddress = (serverAddress: string) => {
    this._serverAddress = serverAddress
  }

  get authUrl() {
    const authUrl = new URL('auth', this.serverAddress)
    return authUrl.href
  }

  getInviteUrl = (cid: string) => {
    const invitationUrl = new URL('invite', this.serverAddress)
    invitationUrl.searchParams.append('CID', cid)
    return invitationUrl.href
  }

  getAuthorizationHeader = (token: string) => {
    return `Bearer ${token}`
  }

  auth = async (): Promise<string> => {
    this.logger('Authenticating')
    const authResponse = await this.fetch(this.authUrl, {
      method: 'POST',
      ...this.fetchConfig,
    })
    this.logger('Auth response status', authResponse.status)
    const authResponseData = await authResponse.json()
    return authResponseData['access_token']
  }

  validateMetadata = (data: ServerStoredCommunityMetadata) => {
    if (!isServerStoredMetadata(data)) throw new Error('Invalid metadata')
  }

  public downloadData = async (cid: string): Promise<ServerStoredCommunityMetadata> => {
    this.logger(`Downloading data for cid: ${cid}`)
    const accessToken = await this.auth()
    const dataResponse: Response = await this.fetch(this.getInviteUrl(cid), {
      method: 'GET',
      headers: { Authorization: this.getAuthorizationHeader(accessToken) },
      ...this.fetchConfig,
    })
    this.logger('Download data response status', dataResponse.status)
    if (!dataResponse.ok) {
      throw new HTTPResponseError('Failed to download data', dataResponse)
    }
    const data: ServerStoredCommunityMetadata = await dataResponse.json()
    this.validateMetadata(data)
    this.logger('Downloaded data', data)
    return data
  }

  public uploadData = async (cid: string, data: ServerStoredCommunityMetadata) => {
    this.logger(`Uploading data for cid: ${cid}`, data)
    this.validateMetadata(data)
    const accessToken = await this.auth()
    const dataResponse: Response = await this.fetch(this.getInviteUrl(cid), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.getAuthorizationHeader(accessToken),
      },
      body: JSON.stringify(data),
      ...this.fetchConfig,
    })
    this.logger('Upload data response status', dataResponse.status)
    if (!dataResponse.ok) {
      throw new HTTPResponseError('Failed to upload data', dataResponse)
    }
    return cid
  }
}
