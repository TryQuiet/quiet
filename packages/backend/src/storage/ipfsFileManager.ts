import { EventEmitter } from 'events'
import fs from 'fs'
import path from 'path'

import PQueue from 'p-queue'

import { decode } from '@ipld/dag-pb'

import type { IPFS } from 'ipfs-core'

import { CID } from 'multiformats/cid'
import { StorageEvents } from './types'

const { compare, createPaths } = await import('../common/utils')

import {
    FileMetadata,
    DownloadStatus,
    DownloadProgress,
    DownloadState,
} from '@quiet/state-manager'
import { filesMasterSaga } from 'packages/state-manager/src/sagas/files/files.master.saga'

export enum IpfsFilesManagerEvents {
    // Incoming evetns
    DOWNLOAD_FILE = 'downloadFile',
    CANCEL_DOWNLOAD = 'cancelDownload',
    // Outgoing evnets
    DOWNLOADED_FILE = 'downloadedFile',
    UPDATE_STATUS = 'updateStatus',
    UPDATE_DOWNLOAD_PROGRESS = 'updateDownloadProgress'
}
interface FilesData {
    size: number,
    downloadedBytes: number,
    transferSpeed: {
        speed: number,
        sinceLastUpdate: number
    },
    cid: any,
    message: {
        id: any
    }
}

export class IpfsFilesManager extends EventEmitter {
    // keep info about all files in progress
    cancelledDownloads: Set<string>
    files: Map<string, FilesData>
    queues: Map<string, {
        queue: PQueue,
        controller: AbortController
    }>
    ipfs: IPFS
    quietDir: string
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
            this.files.set(fileMetadata.cid, {
                size: fileMetadata.size || 0,
                downloadedBytes: 0,
                transferSpeed: {
                    speed: 0,
                    sinceLastUpdate: 0
                },
                cid: fileMetadata.cid,
                message: fileMetadata.message
            })
            await this.downloadBlocks(fileMetadata)
        })
        this.on(IpfsFilesManagerEvents.CANCEL_DOWNLOAD, (mid) => {
            const fileDownloaded = Array.from(this.files.values()).find((e) => e.message.id === mid)
            const queueAndController = this.queues.get(fileDownloaded.cid)
            const queue = queueAndController.queue
            const controller = queueAndController.controller
            controller.abort()
            queue.pause()
            queue.clear()
            this.cancelledDownloads.add(fileDownloaded.cid)
        })
    }

    private downloadBlocks = async (fileMetadata: FileMetadata) => {
        const block = CID.parse(fileMetadata.cid)

        const controller = new AbortController()

        const queue = new PQueue({ concurrency: 40 });

        this.queues.set(fileMetadata.cid, {
            queue,
            controller
        })

        let blocksStats = []
        const seconds = 10

        const updateTransferSpeed = setInterval(() => {
            const bytesDownloaded = blocksStats.reduce((previousValue, currentValue) => {
                if (Math.floor(Date.now() / 1000) - currentValue.fetchTime < seconds) return previousValue + currentValue.byteLength
                return 0
            }, 0)
            const transferSpeed = bytesDownloaded === 0 ? 0 : bytesDownloaded / seconds
            const fileState = this.files.get(fileMetadata.cid)
            this.files.set(fileMetadata.cid, {
                ...fileState, transferSpeed: {
                    speed: transferSpeed,
                    sinceLastUpdate: 234
                }
            })
            this.updateStatus(fileMetadata.cid)
        }, 1000)

        const addToQueue = async (link) => {
            try {

                await queue.add(async ({ signal }) => {
                    try {
                        await processBlock(link.Hash, signal)
                    } catch (e) {
                        console.log('throttling')
                    }
                }, {
                    signal: controller.signal
                })
            } catch (e) {
                console.log('catching')
            }
        }

        const stat = await this.ipfs.files.stat(block)

        if (!compare(fileMetadata.size, stat.size, 0.05)) {
            const maliciousStatus: DownloadStatus = {
                mid: fileMetadata.message.id,
                cid: fileMetadata.cid,
                downloadState: DownloadState.Malicious,
                downloadProgress: undefined
            }

            this.emit(StorageEvents.UPDATE_DOWNLOAD_PROGRESS, maliciousStatus)

            return
        }

        const processBlock = async (block, signal) => {
            return new Promise(async (resolve, reject) => {
                const timeout = setTimeout(async () => {
                    console.log('couldnt fetch block, adding to the end of queue', block)
                    try {

                        await queue.add(async ({ signal }) => {
                            try {
                                await processBlock(block, signal)
                            } catch (e) {
                                console.log('throttling after timeout')
                            }
                        }, { signal: controller.signal })
                    } catch (e) {
                        console.log('catching aborted')
                    }
                    reject('e')
                }, 20_000);

                signal.addEventListener('abort', () => {
                    clearTimeout(timeout)
                    reject('e')
                })

                // first check if we have block locally

                let fetchedBlock = null

                console.log('refs local', this.ipfs.refs.local())

                const localBlock = await (await this.ipfs.dag.get(block)).value

                console.log('local block is ', localBlock)

                const hasBlockBeenDownloaded = false
                if (hasBlockBeenDownloaded) {
                    fetchedBlock = localBlock
                } else {
                    fetchedBlock = await this.ipfs.block.get(block)
                }

                const decodedBlock = decode(fetchedBlock)

                const fileState = this.files.get(fileMetadata.cid)
                this.files.set(fileMetadata.cid, { ...fileState, downloadedBytes: decodedBlock.Data ? fileState.downloadedBytes + decodedBlock.Data.byteLength : fileState.downloadedBytes })

                if (!hasBlockBeenDownloaded) {
                    blocksStats.push({
                        fetchTime: Math.floor(Date.now() / 1000),
                        byteLength: decodedBlock.Data.byteLength
                    })
                }

                for (let link of decodedBlock.Links) {
                    addToQueue(link)
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
                    console.log('throttling after timeout')
                }
            }, { signal: controller.signal })
        } catch (e) {
            console.log('aborted and not throwing any error')
        }

        await queue.onIdle()
        clearInterval(updateTransferSpeed)

        if (this.cancelledDownloads.has(fileMetadata.cid)) {
            const fileState = this.files.get(fileMetadata.cid)
            this.files.set(fileMetadata.cid, {
                ...fileState, downloadedBytes: 0, transferSpeed: {
                    speed: 0, sinceLastUpdate: 0
                }
            })
            this.updateStatus(fileMetadata.cid, DownloadState.Canceled)
            this.cancelledDownloads.delete(fileMetadata.cid)
        } else {
            const fileState = this.files.get(fileMetadata.cid)
            this.files.set(fileMetadata.cid, {
                ...fileState, transferSpeed: {
                    speed: 0, sinceLastUpdate: 0
                }
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
                        console.error(`${fileMetadata.name} download error: ${err}`)
                        reject(err)
                    }
                })
                resolve()
            })
        }

        writeStream.end()

        this.updateStatus(fileMetadata.cid, DownloadState.Completed)

        const meddageMedia: FileMetadata = {
            ...fileMetadata,
            path: filePath
        }

        this.emit('updateFileMetadata', meddageMedia)
    }

    private updateStatus = async (cid, downloadState = DownloadState.Downloading) => {
        const metadata = this.files.get(cid)
        const progress: DownloadProgress = {
            size: metadata.size,
            downloaded: metadata.downloadedBytes,
            transferSpeed: metadata.transferSpeed.speed
        }

        const status: DownloadStatus = {
            mid: metadata.message.id,
            cid: metadata.cid,
            downloadState: downloadState,
            downloadProgress: progress
        }

        this.emit(IpfsFilesManagerEvents.UPDATE_DOWNLOAD_PROGRESS, status)
    }
}