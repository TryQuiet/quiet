import { Test } from '@nestjs/testing'
import { ServerProxyServiceModule } from './storageServerProxy.module'
import { ServerProxyService } from './storageServerProxy.service'
import { ServerStoredCommunityMetadata } from './storageServerProxy.types'
import { jest } from '@jest/globals'
import { prepareResponse } from './testUtils'
import { createLibp2pAddress, getValidInvitationUrlTestData, validInvitationDatav1 } from '@quiet/common'

const mockFetch = async (responseData: Partial<Response>[]) => {
  /** Mock fetch responses and then initialize nest service */
  const mockedFetch = jest.fn(() => {
    return Promise.resolve(prepareResponse(responseData[0]))
  })

  for (const data of responseData) {
    mockedFetch.mockResolvedValueOnce(prepareResponse(data))
  }

  global.fetch = mockedFetch
  const module = await Test.createTestingModule({
    imports: [ServerProxyServiceModule],
  }).compile()
  return module.get<ServerProxyService>(ServerProxyService)
}

describe('Server Proxy Service', () => {
  let clientMetadata: ServerStoredCommunityMetadata
  beforeEach(() => {
    const data = getValidInvitationUrlTestData(validInvitationDatav1[0]).data
    clientMetadata = {
      id: '12345678',
      ownerCertificate: 'MIIDeTCCAyCgAwIBAgIGAYv8J0ToMAoGCCqGSM49BAMCMBIxEDAOBgNVBAMTB21hYzIzMT',
      rootCa: 'MIIBUjCB+KADAgECAgEBMAoGCCqGSM49BAMCMBIxEDAOBgNVBAM',
      ownerOrbitDbIdentity: data.ownerOrbitDbIdentity,
      peerList: [createLibp2pAddress(data.pairs[0].onionAddress, data.pairs[0].peerId)],
      psk: data.psk,
    }
  })

  afterEach(async () => {
    jest.clearAllMocks()
  })

  it('downloads data for existing cid and proper server address', async () => {
    const service = await mockFetch([
      { status: 200, json: () => Promise.resolve({ access_token: 'secretToken' }) },
      { status: 200, json: () => Promise.resolve(clientMetadata) },
    ])
    service.setServerAddress('http://whatever')
    const data = await service.downloadData('cid')
    expect(data).toEqual(clientMetadata)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('throws error if downloaded metadata does not have proper schema', async () => {
    const metadataLackingField = {
      id: clientMetadata.id,
      ownerCertificate: clientMetadata.ownerCertificate,
      rootCa: clientMetadata.rootCa,
      ownerOrbitDbIdentity: clientMetadata.ownerOrbitDbIdentity,
      peerList: clientMetadata.peerList,
    }
    const service = await mockFetch([
      { status: 200, json: () => Promise.resolve({ access_token: 'secretToken' }) },
      { status: 200, json: () => Promise.resolve(metadataLackingField) },
    ])
    service.setServerAddress('http://whatever')
    expect(service.downloadData('cid')).rejects.toThrow('Invalid metadata')
  })

  it('obtains token', async () => {
    const expectedToken = 'verySecretToken'
    const service = await mockFetch([{ status: 200, json: () => Promise.resolve({ access_token: expectedToken }) }])
    service.setServerAddress('http://whatever')
    const token = await service.auth()
    expect(token).toEqual(expectedToken)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})
