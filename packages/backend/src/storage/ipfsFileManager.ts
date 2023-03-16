import { EventEmitter } from 'events'
import fs from 'fs'
import path from 'path'

import PQueue from 'p-queue'

import { decode } from '@ipld/dag-pb'

import * as base58 from 'multiformats/bases/base58'

import type { IPFS } from 'ipfs-core'

import { CID } from 'multiformats/cid'

const { createPaths, compare } = await import('../common/utils')

import {
    FileMetadata,
    DownloadStatus,
    DownloadProgress,
    DownloadState,
} from '@quiet/state-manager'
import { sleep } from '../sleep'

export enum IpfsFilesManagerEvents {
    // Incoming evetns
    DOWNLOAD_FILE = 'downloadFile',
    CANCEL_DOWNLOAD = 'cancelDownload',
    // Outgoing evnets
    UPDATE_MESSAGE_MEDIA = 'updateMessageMedia',
    UPDATE_DOWNLOAD_PROGRESS = 'updateDownloadProgress'
}
interface FilesData {
    size: number,
    downloadedBytes: number,
    transferSpeed: number,
    cid: string,
    message: {
        id: string
    }
}

const TRANSFER_SPEED_SPAN = 10
const UPDATE_STATUS_INTERVAL = 0.1
const BLOCK_FETCH_TIMEOUT = 20
const QUEUE_CONCURRENCY = 40

export class IpfsFilesManager extends EventEmitter {
    ipfs: IPFS
    quietDir: string
    // keep info about all downloads in progress
    cancelledDownloads: Set<string>
    files: Map<string, FilesData>
    queues: Map<string, {
        queue: PQueue,
        controller: AbortController
    }>
    constructor(ipfs: IPFS, quietDir: string) {
        super()
        this.ipfs = ipfs
        this.quietDir = quietDir
        this.files = new Map()
        this.queues = new Map()
        this.cancelledDownloads = new Set()
        this.attachIncomingEvents()
    }

    private attachIncomingEvents = () => {
        this.on(IpfsFilesManagerEvents.DOWNLOAD_FILE, async (fileMetadata: FileMetadata) => {
            if (this.files.get(fileMetadata.cid)) return
            this.files.set(fileMetadata.cid, {
                size: fileMetadata.size || 0,
                downloadedBytes: 0,
                transferSpeed: 0,
                cid: fileMetadata.cid,
                message: fileMetadata.message
            })
            await this.downloadBlocks(fileMetadata)
        })
        this.on(IpfsFilesManagerEvents.CANCEL_DOWNLOAD, async (mid) => {
            const fileDownloaded = Array.from(this.files.values()).find((e) => e.message.id === mid)
            await this.cancelDownload(fileDownloaded.cid)
        })
    }

    public async stop() {
        for await (let cid of this.files.keys()) {
            await this.cancelDownload(cid)
        }
    }

    private cancelDownload = async (cid: string) => {
        const queueAndController = this.queues.get(cid)
        const downloadInProgress = this.files.get(cid)
        if (!downloadInProgress) return
        if (!queueAndController) {
            await sleep(1000)
            await this.cancelDownload(cid)
            {
            }
        } else {
            const queue = queueAndController.queue
            const controller = queueAndController.controller
            this.cancelledDownloads.add(cid)
            controller.abort()
            queue.pause()
            queue.clear()
        }
    }

    private getLocalBlocks = async () => {
        const blocks = []

        const refs = this.ipfs.refs.local()

        for await (let ref of refs) {
            const cid = CID.parse(ref.ref)
            const base58Encoded = base58.base58btc.encode(cid.multihash.bytes)
            blocks.push(base58Encoded.toString())
        }
        return blocks
    }

    private downloadBlocks = async (fileMetadata: FileMetadata) => {
        const block = CID.parse(fileMetadata.cid)

        let localBlocks = await this.getLocalBlocks()
        let processedBlocks = []

        const controller = new AbortController()
        const queue = new PQueue({ concurrency: QUEUE_CONCURRENCY });
        this.queues.set(fileMetadata.cid, {
            queue,
            controller
        })

        const stat = await this.ipfs.files.stat(block)
        if (fileMetadata.size && !compare(fileMetadata.size, stat.size, 0.05)) {
            this.updateStatus(fileMetadata.cid, DownloadState.Malicious)
            return
        }

        const addToQueue = async (link: CID) => {
            try {
                await queue.add(async ({ signal }) => {
                    try {
                        await processBlock(link, signal)
                    } catch (e) {
                    }
                }, {
                    signal: controller.signal
                })
            } catch (e) {
            }
        }

        // Transfer speed
        let blocksStats = []

        const updateTransferSpeed = setInterval(() => {
            const bytesDownloaded = blocksStats.reduce((previousValue, currentValue) => {
                if (Math.floor(Date.now() / 1000) - currentValue.fetchTime < TRANSFER_SPEED_SPAN) return previousValue + currentValue.byteLength
                return 0
            }, 0)
            const transferSpeed = bytesDownloaded === 0 ? 0 : bytesDownloaded / TRANSFER_SPEED_SPAN
            const fileState = this.files.get(fileMetadata.cid)
            this.files.set(fileMetadata.cid, {
                ...fileState, transferSpeed: transferSpeed,

            })
            this.updateStatus(fileMetadata.cid)
        }, UPDATE_STATUS_INTERVAL * 1000)

        const processBlock = async (block: CID, signal: AbortSignal) => {
            return new Promise(async (resolve, reject) => {
                const timeout = setTimeout(() => {
                    addToQueue(block)
                    reject('e')
                }, BLOCK_FETCH_TIMEOUT * 1000);

                if (processedBlocks.includes(block.toString())) {
                    resolve(block)
                }
                signal.addEventListener('abort', () => {
                    clearTimeout(timeout)
                    reject('e')
                })

                const hasBlockBeenDownloaded = localBlocks.includes(`z${block.toString()}`)

                const fetchedBlock = await this.ipfs.block.get(block)

                processedBlocks.push(block.toString())

                const decodedBlock = decode(fetchedBlock)

                const fileState = this.files.get(fileMetadata.cid)

                if (!fileState) {
                    reject('e')
                    return
                }

                this.files.set(fileMetadata.cid, { ...fileState, downloadedBytes: decodedBlock.Data ? fileState.downloadedBytes + decodedBlock.Data.byteLength : fileState.downloadedBytes })

                if (!hasBlockBeenDownloaded) {
                    blocksStats.push({
                        fetchTime: Math.floor(Date.now() / 1000),
                        byteLength: decodedBlock.Data.byteLength
                    })
                }

                for (let link of decodedBlock.Links) {
                    // @ts-ignore
                    addToQueue(link.Hash)
                }
                clearTimeout(timeout)
                resolve(fetchedBlock)
            });
        }

        try {


            await queue.add(async ({ signal }) => {

                try {
                    await processBlock(block, signal)
                } catch (e) {
                }

            }, { signal: controller.signal })
        } catch (e) {
        }

        await queue.onIdle()
        clearInterval(updateTransferSpeed)
        // Also clear local data

        if (this.cancelledDownloads.has(fileMetadata.cid)) {
            const fileState = this.files.get(fileMetadata.cid)

            this.files.set(fileMetadata.cid, {
                ...fileState, downloadedBytes: 0, transferSpeed: 0
            })
            this.updateStatus(fileMetadata.cid, DownloadState.Canceled)
            this.cancelledDownloads.delete(fileMetadata.cid)
            this.files.delete(fileMetadata.cid)
            this.queues.delete(fileMetadata.cid)
        } else {
            const fileState = this.files.get(fileMetadata.cid)
            this.files.set(fileMetadata.cid, {
                ...fileState, transferSpeed: 0
            })
            await this.assemblyFile(fileMetadata)
        }
    }

    private assemblyFile = async (fileMetadata: FileMetadata) => {
        const _CID = CID.parse(fileMetadata.cid)

        const downloadDirectory = path.join(this.quietDir, 'downloads', fileMetadata.cid)
        createPaths([downloadDirectory])

        const fileName = fileMetadata.name + fileMetadata.ext
        const filePath = `${path.join(downloadDirectory, fileName)}`

        const writeStream = fs.createWriteStream(filePath)

        const entries = this.ipfs.cat(_CID)

        for await (const entry of entries) {
            await new Promise<void>((resolve, reject) => {
                writeStream.write(entry, err => {
                    if (err) {
                        console.error(`${fileMetadata.name} writing to file error: ${err}`)
                        reject(err)
                    }
                })
                resolve()
            })
        }

        writeStream.end()

        this.updateStatus(fileMetadata.cid, DownloadState.Completed)
        this.files.delete(fileMetadata.cid)
        this.queues.delete(fileMetadata.cid)

        const messageMedia: FileMetadata = {
            ...fileMetadata,
            path: filePath
        }

        this.emit(IpfsFilesManagerEvents.UPDATE_MESSAGE_MEDIA, messageMedia)
    }

    private updateStatus = async (cid: string, downloadState = DownloadState.Downloading) => {
        const metadata = this.files.get(cid)
        const progress: DownloadProgress = downloadState != DownloadState.Malicious ? {
            size: metadata.size,
            downloaded: metadata.downloadedBytes,
            transferSpeed: metadata.transferSpeed
        } : undefined

        const status: DownloadStatus = {
            mid: metadata.message.id,
            cid: metadata.cid,
            downloadState: downloadState,
            downloadProgress: progress
        }

        this.emit(IpfsFilesManagerEvents.UPDATE_DOWNLOAD_PROGRESS, status)
    }
}