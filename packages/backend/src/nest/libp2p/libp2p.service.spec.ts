import { jest } from '@jest/globals'
import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from '../common/test.module'
import { createPeerId, libp2pInstanceParams } from '../common/utils'
import { Libp2pModule } from './libp2p.module'
import { LIBP2P_PSK_METADATA, Libp2pService } from './libp2p.service'
import { Libp2pEvents, Libp2pNodeParams } from './libp2p.types'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import validator from 'validator'
import waitForExpect from 'wait-for-expect'
import { ProcessInChunksService } from './process-in-chunks.service'

describe('Libp2pService', () => {
    let module: TestingModule
    let libp2pService: Libp2pService
    let params: Libp2pNodeParams
    let processInChunks: ProcessInChunksService<string>

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [TestModule, Libp2pModule],
        }).compile()

        libp2pService = await module.resolve(Libp2pService)
        processInChunks = await module.resolve(ProcessInChunksService<string>)
        params = await libp2pInstanceParams()
    })

    afterAll(async () => {
        await libp2pService.libp2pInstance?.stop()
        await module.close()
    })

    it('create instance libp2p', async () => {
        await libp2pService.createInstance(params)
        expect(libp2pService.libp2pInstance).not.toBeNull()
        expect(libp2pService?.libp2pInstance?.peerId).toBe(params.peerId)
    })

    it('close libp2p service', async () => {
        await libp2pService.createInstance(params)
        await libp2pService.close()
        expect(libp2pService.libp2pInstance).toBeNull()
    })

    it('creates libp2p address', async () => {
        const libp2pAddress = libp2pService.createLibp2pAddress(params.localAddress, params.peerId.toString())
        expect(libp2pAddress).toStrictEqual(
            `/dns4/${params.localAddress}.onion/tcp/80/ws/p2p/${params.peerId.toString()}`
        )
    })

    it('creates libp2p listen address', async () => {
        const libp2pListenAddress = libp2pService.createLibp2pListenAddress('onionAddress')
        expect(libp2pListenAddress).toStrictEqual(`/dns4/onionAddress.onion/tcp/80/ws`)
    })

    it('Generated libp2p psk matches psk composed from existing key', () => {
        const generatedKey = Libp2pService.generateLibp2pPSK()
        const retrievedKey = Libp2pService.generateLibp2pPSK(generatedKey.psk)
        expect(generatedKey).toEqual(retrievedKey)
        expect(validator.isBase64(generatedKey.psk)).toBeTruthy()

        const generatedPskBuffer = Buffer.from(generatedKey.psk, 'base64')
        const expectedFullKeyString = LIBP2P_PSK_METADATA + uint8ArrayToString(generatedPskBuffer, 'base16')
        expect(uint8ArrayToString(generatedKey.fullKey)).toEqual(expectedFullKeyString)
    })

    it(`Starts dialing peers on '${Libp2pEvents.DIAL_PEERS}' event`, async () => {
        const peerId1 = await createPeerId()
        const peerId2 = await createPeerId()
        const addresses = [
            libp2pService.createLibp2pAddress('onionAddress1.onion', peerId1.toString()),
            libp2pService.createLibp2pAddress('onionAddress2.onion', peerId2.toString()),
        ]
        await libp2pService.createInstance(params)
        // @ts-expect-error processItem is private
        const spyOnProcessItem = jest.spyOn(processInChunks, 'processItem')
        expect(libp2pService.libp2pInstance).not.toBeNull()
        libp2pService.emit(Libp2pEvents.DIAL_PEERS, addresses)
        await waitForExpect(async () => {
            expect(spyOnProcessItem).toBeCalledTimes(addresses.length)
        })
    })

    it(`Do not dial peer on '${Libp2pEvents.DIAL_PEERS}' event if peer was already dialed`, async () => {
        const peerId1 = await createPeerId()
        const peerId2 = await createPeerId()
        const alreadyDialedAddress = libp2pService.createLibp2pAddress('onionAddress1.onion', peerId1.toString())
        libp2pService.dialedPeers.add(alreadyDialedAddress)
        const addresses = [
            alreadyDialedAddress,
            libp2pService.createLibp2pAddress('onionAddress2.onion', peerId2.toString()),
        ]
        await libp2pService.createInstance(params)
        expect(libp2pService.libp2pInstance).not.toBeNull()
        // @ts-expect-error processItem is private
        const dialPeerSpy = jest.spyOn(processInChunks, 'processItem')
        libp2pService.emit(Libp2pEvents.DIAL_PEERS, addresses)
        await waitForExpect(async () => {
            expect(dialPeerSpy).toBeCalledTimes(1)
        })
    })
})
