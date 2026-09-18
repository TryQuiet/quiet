import { jest } from '@jest/globals'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { DownloadState, type FileMetadata } from '@quiet/types'
import { IpfsFileManagerService } from './ipfs-file-manager.service'
import { IpfsFilesManagerEvents } from './ipfs-file-manager.types'
import { dmFixture, dmMessage } from '../auth/services/crypto/direct-message-test-utils'
import { createLogger } from '../common/logger'

async function* chunks(values: Uint8Array[]) {
  yield* values
}
const collect = async (stream: AsyncIterable<Uint8Array>) => {
  const result: Uint8Array[] = []
  for await (const value of stream) result.push(value)
  return result
}

describe('DM attachment publication', () => {
  let fixture: ReturnType<typeof dmFixture>
  let directory: string
  beforeAll(() => {
    fixture = dmFixture()
  })
  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-dm-files-'))
  })
  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true })
  })

  it.each(['honest', 'truncated', 'corrupt', 'reordered', 'wrong DM key', 'abort'])(
    'publishes only a fully authenticated file: %s',
    async attack => {
      const { bob, carol, channel } = fixture
      const plain = [Buffer.from('Private file block one'), Buffer.from('Private file block two')]
      const sealed = bob.directMessages.encryptStream(chunks(plain), channel.id)
      let encrypted = await collect(sealed.encryptStream)
      if (attack === 'truncated') encrypted = encrypted.slice(0, -1)
      if (attack === 'corrupt') encrypted[0][0] ^= 1
      if (attack === 'reordered') encrypted.reverse()
      let destination = channel.id
      if (attack === 'wrong DM key') {
        const other = bob.directMessages.create([carol.user.userId])
        carol.directMessages.openDescriptor(bob.directMessages.descriptor(other.id), other.id)
        destination = other.id
      }
      const size = encrypted.reduce((total, block) => total + block.length, 0)
      const metadata: FileMetadata = {
        name: 'private',
        ext: '.txt',
        size,
        path: null,
        cid: 'bafkreigh2akiscaildcq2khwjeahntt3k6wk7gi2tqe7ms43hypsj7hazu',
        message: { id: dmMessage(bob, channel).id, channelId: destination },
        enc: {
          header: Buffer.from(sealed.header).toString('base64url'),
          recipient: { ...sealed.recipient, name: destination },
        },
      }
      const manager = new IpfsFileManagerService(
        directory,
        { getActiveChain: () => carol } as never,
        {} as never,
        {} as never
      )
      // IPFS transport supplies bytes. Real production decryption, stream writing, status and cleanup run below.
      manager.ufs = {
        stat: async () => ({ fileSize: BigInt(size), localFileSize: BigInt(size) }),
        cat: async function* () {
          yield encrypted[0]
          if (attack === 'abort') manager.controllers.get(metadata.cid)!.controller.abort()
          yield* encrypted.slice(1)
        },
      } as never
      manager.ipfs = { pins: { isPinned: async () => true } } as never
      manager.files.set(metadata.cid, { ...metadata, size, downloadedBytes: 0, transferSpeed: 0 })
      const published: FileMetadata[] = []
      manager.on(IpfsFilesManagerEvents.MESSAGE_MEDIA_UPDATED, media => published.push(media))
      const result = await (manager as any)._downloadFile(metadata, createLogger('dm-file-regression'))
      const diskFiles = fs.readdirSync(path.join(directory, 'downloads'))
      if (attack === 'honest') {
        expect(result).toBe(DownloadState.Completed)
        expect(published).toHaveLength(1)
        expect(fs.readFileSync(published[0].path!)).toEqual(Buffer.concat(plain))
        expect(diskFiles).toHaveLength(1)
      } else {
        expect(result).toBe(DownloadState.Canceled)
        expect(published).toEqual([])
        expect(diskFiles).toEqual([])
      }
    }
  )

  it('refuses to upload an unknown DM before reading or copying the source file', async () => {
    const manager = new IpfsFileManagerService(
      directory,
      { getActiveChain: () => fixture.eve } as never,
      {} as never,
      {} as never
    )
    const copy = jest.spyOn(manager, 'copyFile')
    await expect(
      manager.attachFile({
        name: 'confidential',
        ext: '.txt',
        path: '/not-read',
        cid: 'attaching',
        message: { id: 'attachment', channelId: fixture.channel.id },
      })
    ).rejects.toThrow()
    expect(copy).not.toHaveBeenCalled()
    expect(fs.readdirSync(directory)).toEqual([])
  })
})
