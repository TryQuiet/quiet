import { DownloadState } from '@quiet/types'
import React, { FC, useEffect, useState } from 'react'
import { View, Image, TouchableWithoutFeedback, Alert } from 'react-native'
import { Typography } from '../Typography/Typography.component'
import { FileActionsProps, UploadedFileProps } from './UploadedFile.types'
import { defaultTheme } from '../../styles/themes/default.theme'
import { appImages } from '../../assets'
import { formatBytes } from '@quiet/state-manager'
import { createLogger } from '../../utils/logger'

const logger = createLogger('uploadedFile:component')

interface FileStatus {
  label: string
  action?: () => void
  actionLabel?: string
}

export const UploadedFile: FC<UploadedFileProps & FileActionsProps> = ({
  message,
  downloadStatus,
  downloadFile,
  cancelDownload,
}) => {
  const downloadState = downloadStatus?.downloadState
  const media = message.media
  const [fileStatus, setFileStatus] = useState<FileStatus | null>(null)
  useEffect(() => {
    if (!media) return
    switch (downloadState) {
      case DownloadState.Uploading:
        setFileStatus({
          label: 'Uploading...',
        })
        break
      case DownloadState.Hosted:
        setFileStatus({
          label: 'Uploaded',
          action: () => {
            logger.info('Showing in folder')
          },
          actionLabel: 'Show in folder',
        })
        break
      case DownloadState.Ready:
        setFileStatus({
          // FIXME: Downloading file freezes the app
          label: 'File ready to download',
          action: () => logger.info('Downloading file'),
          actionLabel: 'Download file',
        })
        break
      case DownloadState.Queued:
        setFileStatus({
          label: 'Queued for download',
        })
        break
      case DownloadState.Downloading:
        setFileStatus({
          label: 'Downloading...',
          action: () => cancelDownload({ mid: message.id, cid: media.cid }),
          actionLabel: 'Cancel download',
        })
        break
      case DownloadState.Canceling:
        setFileStatus({
          label: 'Canceling...',
        })
        break
      case DownloadState.Canceled:
        setFileStatus({
          label: 'Canceled',
          action: () => downloadFile(media),
          actionLabel: 'Download file',
        })
        break
      case DownloadState.Completed:
        setFileStatus({
          label: 'Downloaded',
          action: () => {
            logger.info('Opening containing folder')
          },
          actionLabel: 'Open containing folder',
        })
        break
      case DownloadState.Malicious:
        setFileStatus({
          label: 'File not valid. Download canceled.',
        })
        break
      default:
        setFileStatus(null)
    }
  }, [downloadState, media])

  return (
    <TouchableWithoutFeedback
      onPress={() => Alert.alert('Not supported yet', 'Sorry, opening files is not supported yet on mobile.')}
    >
      <View
        style={{
          backgroundColor: defaultTheme.palette.background.white,
          maxWidth: '100%',
          marginTop: 8,
          padding: 16,
          borderRadius: 8,
          borderColor: defaultTheme.palette.typography.veryLightGray,
          borderStyle: 'solid',
          borderWidth: 1,
        }}
      >
        <Typography fontSize={12} style={{ fontWeight: 'bold' }}>
          {media?.name}
          {media?.ext}
        </Typography>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={appImages.file_document}
            resizeMode='cover'
            resizeMethod='resize'
            style={{
              width: 20,
              height: 20,
              marginRight: 5,
            }}
          />
          <View>
            <Typography fontSize={12} style={{ lineHeight: 20, color: defaultTheme.palette.typography.grayDark }}>
              {media?.size ? formatBytes(media?.size) : 'Calculating size...'}
            </Typography>
            {fileStatus && (
              <Typography fontSize={12} style={{ color: defaultTheme.palette.typography.grayDark }}>
                {fileStatus.label}
              </Typography>
            )}
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  )
}
