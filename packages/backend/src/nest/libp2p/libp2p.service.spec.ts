import { Test, TestingModule } from '@nestjs/testing'
import { jest } from '@jest/globals'
import { TestModule } from '../common/test.module'
import { generateLibp2pPSK, LIBP2P_PSK_METADATA, libp2pInstanceParams } from '../common/utils'
import { Libp2pModule } from './libp2p.module'
import { Libp2pService } from './libp2p.service'
import { Libp2pNodeParams } from './libp2p.types'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import validator from 'validator'

describe('Libp2pService', () => {
  let module: TestingModule
  let libp2pService: Libp2pService
  let params: Libp2pNodeParams

  const localPeerAddress = '/dns4/local.onion/tcp/80/ws/p2p/local-peer'
  const remotePeerAddress = '/dns4/remote.onion/tcp/80/ws/p2p/remote-peer'
  const connectedRemotePeerAddress = '/dns4/connected-remote.onion/tcp/80/ws/p2p/remote-peer'

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, Libp2pModule],
    }).compile()

    libp2pService = await module.resolve(Libp2pService)
    params = await libp2pInstanceParams()
  })

  beforeEach(() => {
    jest.restoreAllMocks()
    jest.spyOn((libp2pService as any).localDbService, 'hasPendingServerAcceptance').mockResolvedValue(false)
    libp2pService.localAddress = localPeerAddress
    libp2pService.connectedPeers.clear()
    libp2pService.dialedPeers.clear()
  })

  afterAll(async () => {
    await libp2pService.close()
    await module.close()
  })

  it('create instance libp2p', async () => {
    await libp2pService.createInstance(params)
    expect(libp2pService.libp2pInstance).not.toBeNull()
    expect(libp2pService?.libp2pInstance?.peerId.toString()).toBe(params.peerId.peerId.toString())
  })

  it('close libp2p service', async () => {
    await libp2pService.createInstance(params)
    await libp2pService.close()
    expect(libp2pService.libp2pInstance).toBeNull()
  })

  it('creates libp2p address', async () => {
    const libp2pAddress = libp2pService.createLibp2pAddress(params.localAddress, params.peerId.toString())
    expect(libp2pAddress).toStrictEqual(`/dns4/${params.localAddress}.onion/tcp/80/ws/p2p/${params.peerId.toString()}`)
  })

  it('creates libp2p listen address', async () => {
    const libp2pListenAddress = libp2pService.createLibp2pListenAddress('onionAddress')
    expect(libp2pListenAddress).toStrictEqual(`/dns4/onionAddress.onion/tcp/80/ws`)
  })

  it('Generated libp2p psk matches psk composed from existing key', () => {
    const generatedKey = generateLibp2pPSK()
    const retrievedKey = generateLibp2pPSK(generatedKey.psk)
    expect(generatedKey).toEqual(retrievedKey)
    expect(validator.isBase64(generatedKey.psk)).toBeTruthy()

    const generatedPskBuffer = Buffer.from(generatedKey.psk, 'base64')
    const expectedFullKeyString = LIBP2P_PSK_METADATA + uint8ArrayToString(generatedPskBuffer, 'base16')
    expect(uint8ArrayToString(generatedKey.fullKey)).toEqual(expectedFullKeyString)
  })

  it('redials sorted peers even when no peers were previously dialed', async () => {
    jest
      .spyOn((libp2pService as any).localDbService, 'getSortedPeers')
      .mockResolvedValue([remotePeerAddress, localPeerAddress, remotePeerAddress])
    const hangUpPeers = jest.spyOn(libp2pService, 'hangUpPeers').mockResolvedValue(undefined)
    const dialPeers = jest.spyOn(libp2pService, 'dialPeers').mockResolvedValue(undefined)

    await libp2pService.redialPeers()

    expect(hangUpPeers).toHaveBeenCalledWith([remotePeerAddress])
    expect(dialPeers).toHaveBeenCalledWith([remotePeerAddress])
  })

  it('redials explicit peers once and hangs up their active connected address', async () => {
    const getSortedPeers = jest.spyOn((libp2pService as any).localDbService, 'getSortedPeers')
    libp2pService.connectedPeers.set('remote-peer', {
      peerId: 'remote-peer',
      address: connectedRemotePeerAddress,
      connectedAtSeconds: 1,
    })
    const hangUpPeers = jest.spyOn(libp2pService, 'hangUpPeers').mockResolvedValue(undefined)
    const dialPeers = jest.spyOn(libp2pService, 'dialPeers').mockResolvedValue(undefined)

    await libp2pService.redialPeers([remotePeerAddress, remotePeerAddress, localPeerAddress])

    expect(getSortedPeers).not.toHaveBeenCalled()
    expect(hangUpPeers).toHaveBeenCalledWith([connectedRemotePeerAddress])
    expect(dialPeers).toHaveBeenCalledWith([remotePeerAddress])
  })

  it('does not dial a peer while server acceptance is pending', async () => {
    const originalInstance = libp2pService.libp2pInstance
    const dial = jest.fn()
    libp2pService.libp2pInstance = {
      peerId: { toString: () => 'local-peer' },
      dial,
    } as any
    ;(libp2pService as any).localDbService.hasPendingServerAcceptance.mockResolvedValue(true)

    try {
      await libp2pService.dialPeer(remotePeerAddress)
      expect(dial).not.toHaveBeenCalled()
    } finally {
      libp2pService.libp2pInstance = originalInstance
    }
  })

  it('does not resume peer connections while server acceptance is pending', async () => {
    const originalInstance = libp2pService.libp2pInstance
    libp2pService.libp2pInstance = {} as any
    ;(libp2pService as any).localDbService.hasPendingServerAcceptance.mockResolvedValue(true)

    try {
      await expect(libp2pService.resume()).resolves.toBe(false)
      expect(libp2pService.state).toBe('paused')
    } finally {
      libp2pService.libp2pInstance = originalInstance
    }
  })
})
