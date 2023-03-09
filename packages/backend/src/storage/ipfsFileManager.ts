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
    transferSpeed: number,
    cid: any,
    message: {
        id: any
    }
}

export class IpfsFilesManager extends EventEmitter {
    // keep info about all files in progress
    cancelledDownloads: Set<string>
    files: Map<string, FilesData>
    ipfs: IPFS
    quietDir: string
    constructor(ipfs: IPFS, quietDir: string) {
        super()
        this.ipfs = ipfs
        this.quietDir = quietDir
        this.files = new Map()
        this.cancelledDownloads = new Set()
        this.attachIncomingEvents()
        this.attachOutgoingEvents()
    }

    private attachIncomingEvents = () => {
        console.log('attaching incoming events in filesManager')
        this.on(IpfsFilesManagerEvents.DOWNLOAD_FILE, async (fileMetadata: FileMetadata) => {
            // should have fileSize and downloaded blocks size
            this.files.set(fileMetadata.cid, {
                size: fileMetadata.size || 0,
                downloadedBytes: 50000,
                transferSpeed: 600,
                cid: fileMetadata.cid,
                message: fileMetadata.message
            })
            console.log('calling download blocks')
            await this.downloadBlocks(fileMetadata)
        })
        this.on(IpfsFilesManagerEvents.CANCEL_DOWNLOAD, (mid) => {
            const fileDownloaded = Array.from(this.files.values()).find((e) => e.message.id === mid)
            this.cancelledDownloads.add(fileDownloaded.cid)
        })
    }

    private attachOutgoingEvents = () => {
        console.log('attaching outgoing events in files manager')
        this.on(IpfsFilesManagerEvents.DOWNLOADED_FILE, async () => {

        })
        this.on(IpfsFilesManagerEvents.UPDATE_STATUS, async () => {

        })
    }

    private downloadBlocks = async (fileMetadata: FileMetadata) => {
        console.log('downloadBlocks')

        const block = CID.parse(fileMetadata.cid)

        const queue = new PQueue({ concurrency: 40 });

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

        const processBlock = async (block) => {
            if (this.cancelledDownloads.has(fileMetadata.cid)) {
                console.log('cancelled download')
                queue.pause(),
                    queue.clear()
                return
            }

            console.log("processing block ", block)
            return new Promise(async (resolve, reject) => {
                const timeout = setTimeout(() => {
                    console.log('couldnt fetch block, adding to the end of queue')
                    queue.add(async () => {
                        try {
                            await processBlock(block)
                        } catch (e) {
                            console.log('throttling after timeout')
                        }
                    })
                    reject('e')
                }, 20_000);

                console.log('before getting block')
                const fetchedBlock = await this.ipfs.block.get(block)

                const decodedBlock = decode(fetchedBlock)
                console.log('decodedBlock', decodedBlock.Data.byteLength)

                const fileState = this.files.get(fileMetadata.cid)
                this.files.set(fileMetadata.cid, { ...fileState, downloadedBytes: fileState.downloadedBytes + decodedBlock.Data.byteLength })
                this.updateStatus(fileMetadata.cid)

                for (let link of decodedBlock.Links) {
                    queue.add(async () => {
                        console.log('adding fetched new blocks to queue')
                        try {
                            await processBlock(link.Hash)
                        } catch (e) {
                            console.log('throttling')
                        }
                    })
                }
                console.log('after getting block')
                clearTimeout(timeout)
                resolve(fetchedBlock)
            });
        }

        queue.add(async () => {
            console.log(
                'adding first block to queue'
            )
            try {
                await processBlock(block)
            } catch (e) {
                console.log('throttling after timeout')
            }
        })

        console.log('empty queue?')

        await queue.onIdle()

        console.log('yes it is empty now ')
        if (this.cancelledDownloads.has(fileMetadata.cid)) {
            console.log('sending cancelled status')
            const fileState = this.files.get(fileMetadata.cid)
            this.files.set(fileMetadata.cid, { ...fileState, downloadedBytes: 0, transferSpeed: 0 })
            this.updateStatus(fileMetadata.cid, DownloadState.Canceled)
            this.cancelledDownloads.delete(fileMetadata.cid)
        } else {
            const fileState = this.files.get(fileMetadata.cid)
            this.files.set(fileMetadata.cid, { ...fileState, transferSpeed: 0 })
            console.log('before assembling file')
            await this.assemblyFile(fileMetadata)
            console.log('after assembling file')
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
                console.log('wrote to the file')
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
            transferSpeed: 0
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