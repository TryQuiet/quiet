import { createTransform } from 'redux-persist'
import { StoreKeys } from '../store.keys'
import { downloadStatusAdapter } from './files.adapter'
import { type FilesState } from './files.slice'
import { isDefined } from '@quiet/common'
import { DownloadState, type DownloadStatus } from '@quiet/types'

export const FilesTransform = createTransform(
    (inboundState: FilesState, _key: any) => {
        return { ...inboundState }
    },
    (outboundState: FilesState, _key: any) => {
        const downloadStatuses = Object.values(outboundState.downloadStatus.entities).filter(isDefined)
        const updatedStatuses: DownloadStatus[] = downloadStatuses.reduce((result: DownloadStatus[], status) => {
            const downloadState = status.downloadState
            const entry: DownloadStatus = {
                ...status,
                downloadState: downloadState !== DownloadState.Canceling ? downloadState : DownloadState.Canceled,
            }
            result.push(entry)
            return result
        }, [])
        return {
            ...outboundState,
            downloadStatus: downloadStatusAdapter.setAll(downloadStatusAdapter.getInitialState(), updatedStatuses),
        }
    },
    { whitelist: [StoreKeys.Files] }
)
