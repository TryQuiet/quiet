import { Injectable } from '@nestjs/common'
import EventEmitter from 'events'
import { ServerStoredCommunityMetadata } from './storageServerProxy.types'
import fetchRetry from 'fetch-retry'
import Logger from '../common/logger'
const fetch = fetchRetry(global.fetch)
// TODO: handle errors
// TODO: handle retries
@Injectable()
export class ServerProxyService extends EventEmitter {
  private readonly logger = Logger(ServerProxyService.name)
  serverAddress: string

  constructor() {
    super()
  }

  setServerAddress = (serverAddress: string) => {
    this.serverAddress = serverAddress
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

  auth = async () => {
    this.logger('Authenticating')
    const authResponse = await fetch(this.authUrl, {
      method: 'POST',
    })
    this.logger('Auth response status', authResponse.status)
    const authResponseData = await authResponse.json()
    return authResponseData['access_token']
  }

  public downloadData = async (cid: string): Promise<ServerStoredCommunityMetadata> => {
    this.logger('Downloading data', cid)
    const accessToken = await this.auth()
    const dataResponse = await fetch(this.getInviteUrl(cid), {
      method: 'GET',
      headers: { Authorization: this.getAuthorizationHeader(accessToken) },
    })
    const data: ServerStoredCommunityMetadata = await dataResponse.json()
    this.logger('Downloaded data', data)
    return data
  }

  public uploadData = async (cid: string, data: ServerStoredCommunityMetadata) => {
    this.logger('Uploading data', cid, data)
    const accessToken = await this.auth()
    const dataResponsePost = await fetch(this.getInviteUrl(cid), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.getAuthorizationHeader(accessToken),
      },
      body: JSON.stringify(data),
    })
    this.logger('Upload data response status', dataResponsePost)
    return cid
  }
}
