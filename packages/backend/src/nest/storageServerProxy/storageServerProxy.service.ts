import { Injectable, OnModuleInit } from '@nestjs/common'
import EventEmitter from 'events'
import { ServerStoredCommunityMetadata } from './storageServerProxy.types'
import fetchRetry from 'fetch-retry'
import { SocketActionTypes } from '@quiet/types'
const fetch = fetchRetry(global.fetch)
// TODO: handle errors
// TODO: handle retries
@Injectable()
export class ServerProxyService extends EventEmitter implements OnModuleInit {
  serverAddress: string

  constructor() {
    super()
  }

  onModuleInit() {
    this.on(SocketActionTypes.SET_STORAGE_SERVER_ADDRESS, (payload: { serverAddress: string }) =>
      this.setServerAddress(payload.serverAddress)
    )
    this.on(
      SocketActionTypes.DOWNLOAD_STORAGE_SERVER_DATA,
      async (payload: { cid: string }, callback: (downloadedData: ServerStoredCommunityMetadata) => void) => {
        callback(await this.downloadData(payload.cid))
      }
    )
    this.on(
      SocketActionTypes.UPLOAD_STORAGE_SERVER_DATA,
      async (payload: { cid: string; data: ServerStoredCommunityMetadata }, callback: (cid: string) => void) => {
        callback(await this.uploadData(payload.cid, payload.data))
      }
    )
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
    console.log('Authenticating')
    const authResponse = await fetch(this.authUrl, {
      method: 'POST',
    })
    console.log('Auth response status', authResponse.status)
    const authResponseData = await authResponse.json()
    console.log('Auth response data', authResponseData)
    return authResponseData['access_token']
  }

  public downloadData = async (cid: string): Promise<ServerStoredCommunityMetadata> => {
    console.log('Downloading data', cid)
    const accessToken = await this.auth()
    const dataResponse = await fetch(this.getInviteUrl(cid), {
      method: 'GET',
      headers: { Authorization: this.getAuthorizationHeader(accessToken) },
    })
    const data = await dataResponse.json()
    console.log('Downloaded data', data)
    // this.emit('storageServerDataDownloaded', data)
    return data
  }

  public uploadData = async (cid: string, data: ServerStoredCommunityMetadata) => {
    console.log('Uploading data', cid, data)
    const accessToken = await this.auth()
    const putBody = JSON.stringify(data)
    console.log('putBody', putBody)
    const dataResponsePost = await fetch(this.getInviteUrl(cid), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.getAuthorizationHeader(accessToken),
      },
      body: putBody,
    })
    console.log('Upload data response status', dataResponsePost)
    // if (dataResponsePost.status === 200) {
    //   this.emit('storageServerDataUploaded', { cid })
    // }
    return cid
  }
}
