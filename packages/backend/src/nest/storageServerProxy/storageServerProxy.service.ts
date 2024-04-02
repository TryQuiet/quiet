import { Injectable } from '@nestjs/common'
import EventEmitter from 'events'
import { ServerStoredCommunityMetadata } from './storageServerProxy.types'
import fetchRetry from 'fetch-retry'
import Logger from '../common/logger'

class HTTPResponseError extends Error {
  response: Response
  constructor(message: string, response: Response) {
    super(`${message}: ${response.status} ${response.statusText}`)
    this.response = response
  }
}

@Injectable()
export class ServerProxyService extends EventEmitter {
  private readonly logger = Logger(ServerProxyService.name)
  _serverAddress: string
  fetch: any

  constructor() {
    super()
    this.fetch = fetchRetry(global.fetch)
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
    })
    this.logger('Auth response status', authResponse.status)
    const authResponseData = await authResponse.json()
    return authResponseData['access_token']
  }

  public downloadData = async (cid: string): Promise<ServerStoredCommunityMetadata> => {
    this.logger('Downloading data', cid)
    const accessToken = await this.auth()
    const dataResponse: Response = await this.fetch(this.getInviteUrl(cid), {
      method: 'GET',
      headers: { Authorization: this.getAuthorizationHeader(accessToken) },
      retries: 3,
    })
    this.logger('Download data response status', dataResponse.status)
    if (!dataResponse.ok) {
      throw new HTTPResponseError('Failed to download data', dataResponse)
    }
    const data: ServerStoredCommunityMetadata = await dataResponse.json()
    this.logger('Downloaded data', data)
    return data
  }

  public uploadData = async (cid: string, data: ServerStoredCommunityMetadata) => {
    this.logger('Uploading data', cid, data)
    const accessToken = await this.auth()
    const dataResponse: Response = await this.fetch(this.getInviteUrl(cid), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.getAuthorizationHeader(accessToken),
      },
      body: JSON.stringify(data),
      retries: 3,
    })
    this.logger('Upload data response status', dataResponse.status)
    if (!dataResponse.ok) {
      throw new HTTPResponseError('Failed to upload data', dataResponse)
    }
    return cid
  }
}
