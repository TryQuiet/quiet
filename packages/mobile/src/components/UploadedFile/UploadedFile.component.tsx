import { DownloadState, formatBytes } from '@quiet/state-manager'
import React, { FC, useEffect, useState } from 'react'
import { View } from 'react-native'
import { Typography } from '../Typography/Typography.component'
import { FileActionsProps, UploadedFileProps } from './UploadedFile.types'
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu'
import { defaultTheme } from '../../styles/themes/default.theme'

interface FileStatus {
  label: string
  action?: () => void
  actionLabel?: string
}

export const UploadedFile: FC<UploadedFileProps & FileActionsProps> = ({
  message,
  downloadStatus,
  downloadFile,
  cancelDownload
}) => {
  const downloadState = downloadStatus?.downloadState
  const media = message.media
  console.log('Uploadeditem', media.name, downloadState)
  const [fileStatus, setFileStatus] = useState<FileStatus>({ label: '' })
  useEffect(() => {
    switch (downloadState) {
      case DownloadState.Uploading:
        setFileStatus({
          label: 'Uploading...'
        })
        break
      case DownloadState.Hosted:
        setFileStatus({
          label: 'Uploaded', action: () => { console.log('Showing in folder') }, actionLabel: 'Show in folder'
        })
        break
      case DownloadState.Ready:
        setFileStatus({
          label: 'File ready to download', action: () => downloadFile(media), actionLabel: 'Download file'
        })
        break
      case DownloadState.Queued:
        setFileStatus({
          label: 'Queued for download'
        })
        break
      case DownloadState.Downloading:
        setFileStatus({
          label: 'Downloading...', action: () => cancelDownload({ mid: message.id, cid: media.cid }), actionLabel: 'Cancel download'
        })
        break
      case DownloadState.Canceling:
        setFileStatus({
          label: 'Canceling...'
        })
        break
      case DownloadState.Canceled:
        setFileStatus({
          label: 'Canceled', action: () => downloadFile(media), actionLabel: 'Download file'
        })
        break
      case DownloadState.Completed:
        setFileStatus({
          label: 'Downloaded', action: () => { console.log('Opening containing folder') }, actionLabel: 'Open containing folder'
        })
        break
      case DownloadState.Malicious:
        setFileStatus({
          label: 'File not valid. Download canceled.'
        })
        break
      default:
        setFileStatus({
          label: ''
        })
    }
  }, [downloadState])

  return (
    <Menu>
      <MenuTrigger
        triggerOnLongPress
        disabled={!fileStatus.action}
        >
        <View style={{
          backgroundColor: defaultTheme.palette.background.white,
          maxWidth: '100%',
          marginTop: 8,
          padding: 16,
          borderRadius: 8,
          borderColor: defaultTheme.palette.typography.veryLightGray,
          borderStyle: 'solid',
          borderWidth: 1
        }}>
          <Typography fontSize={12} style={{ fontWeight: 'bold' }}>
            {media.name}
            {media.ext}
          </Typography>
          <Typography
            fontSize={12}
            style={{ lineHeight: 20, color: defaultTheme.palette.typography.grayDark }}>
            {media?.size ? formatBytes(media?.size) : 'Calculating size...'}
          </Typography>
          {fileStatus.label !== '' && <Typography fontSize={14} style={{ color: defaultTheme.palette.typography.grayDark }}>{fileStatus.label}</Typography>}
        </View>
      </MenuTrigger>
      <MenuOptions>
        <MenuOption onSelect={fileStatus.action} text={fileStatus.actionLabel} />
      </MenuOptions>
    </Menu>
  )
}
