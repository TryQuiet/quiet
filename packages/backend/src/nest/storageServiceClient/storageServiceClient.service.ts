import { Injectable } from '@nestjs/common'
import EventEmitter from 'events'
import { ServerStoredCommunityMetadata } from './storageServiceClient.types'
import fetchRetry, { RequestInitWithRetry } from 'fetch-retry'
import { createLogger } from '../common/logger'
import { isServerStoredMetadata } from '../validation/validators'
import fetch, { Response } from 'node-fetch'

class HTTPResponseError extends Error {
  response: Response
  constructor(message: string, response: Response) {
    super(`${message}: ${response.status} ${response.statusText}`)
    this.response = response
  }
}

@Injectable()
export class StorageServiceClient extends EventEmitter {
  DEFAULT_FETCH_RETRIES = 5
  private readonly logger = createLogger(StorageServiceClient.name)
  _serverAddress: string
  fetch: any
  fetchConfig: RequestInitWithRetry<typeof fetch>

  constructor() {
    super()
    this.fetch = fetchRetry(fetch)
    this.fetchConfig = {
      retries: this.DEFAULT_FETCH_RETRIES,
      retryDelay: (attempt: number, _error: Error | null, _response: Response | null) => {
        this.logger.info(`Retrying request ${attempt}/${this.DEFAULT_FETCH_RETRIES}`)
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
    this.logger.info('Authenticating')
    const authResponse = await this.fetch(this.authUrl, {
      method: 'POST',
      ...this.fetchConfig,
    })
    this.logger.info('Auth response status', authResponse.status)
    const authResponseData = await authResponse.json()
    return authResponseData['access_token']
  }

  validateMetadata = (data: ServerStoredCommunityMetadata) => {
    if (!isServerStoredMetadata(data)) throw new Error('Invalid metadata')
  }

  public downloadData = async (cid: string): Promise<ServerStoredCommunityMetadata> => {
    this.logger.info(`Downloading data for cid: ${cid}`)
    const accessToken = await this.auth()
    const dataResponse: Response = await this.fetch(this.getInviteUrl(cid), {
      method: 'GET',
      headers: { Authorization: this.getAuthorizationHeader(accessToken) },
      ...this.fetchConfig,
    })
    this.logger.info('Download data response status', dataResponse.status)
    if (!dataResponse.ok) {
      throw new HTTPResponseError('Failed to download data', dataResponse)
    }
    const data = (await dataResponse.json()) as ServerStoredCommunityMetadata
    this.validateMetadata(data)
    this.logger.info('Downloaded data', data)
    return data
  }

  public uploadData = async (cid: string, data: ServerStoredCommunityMetadata) => {
    this.logger.info(`Uploading data for cid: ${cid}`, data)
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
    this.logger.info('Upload data response status', dataResponse.status)
    if (!dataResponse.ok) {
      throw new HTTPResponseError('Failed to upload data', dataResponse)
    }
    return cid
  }
}
