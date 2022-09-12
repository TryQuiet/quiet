import { DownloadState, formatBytes } from '@quiet/state-manager'
import React, { FC } from 'react'
import {View} from 'react-native'
import { TouchableWithoutFeedback} from 'react-native-gesture-handler'
import { Typography } from '../Typography/Typography.component'
import { FileActionsProps, UploadedFileProps } from './UploadedFile.types'

interface ActionIndicatorProps {
  label: string
  action?: () => void
}

const ActionIndicator: FC<ActionIndicatorProps> = ({
  label,
  action
}) => {
  return <TouchableWithoutFeedback onPress={action} onLongPress={() => {console.log('LONG PRESSED')}}>
    <Typography fontSize={14}>{label}</Typography>
  </TouchableWithoutFeedback>
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

  const renderActionIndicator = () => {
    switch (downloadState) {
      case DownloadState.Uploading:
        return (
          <ActionIndicator
          label='Uploading...'
          />
        )
      case DownloadState.Hosted:
        return (
          <ActionIndicator
            label='Show in folder'
            action={() => {console.log('Show in containing folder')}}
          />
        )
      case DownloadState.Ready:
        return (
          <ActionIndicator
          label='Download file'
            action={() => {
              console.log('Download file')
              downloadFile(media)
            }}
          />
        )
      case DownloadState.Queued:
        return (
          <ActionIndicator
            label='Queued for download'
          />
        )
      case DownloadState.Downloading:
        return (
          <ActionIndicator
            label='Downloading...'
            action={() => {
              console.log('_cancelDownload')
              cancelDownload({
                mid: message.id,
                cid: media.cid
              })

            }}
          />
        )
      case DownloadState.Canceling:
        return (
          <ActionIndicator
            label={'Canceling...'}
          />
        )
      case DownloadState.Canceled:
        return (
          <ActionIndicator
          label='Canceled. Download file'
            action={() => {downloadFile(media)}}
          />
        )
      case DownloadState.Completed:
        return (
          <ActionIndicator
            label='Show in folder'
            action={() => {console.log('_openContainingFolder')}}
          />
        )
      case DownloadState.Malicious:
        return (
          <ActionIndicator
            label='File not valid. Download canceled.'
          />
        )
      default:
        return <></>
    }
  }


  return (
    <View style={{
      backgroundColor: 'white', 
      maxWidth: '100%',
      marginTop: 8,
      padding: 16,
      borderRadius: 8,
      borderColor: 'lightGray',
      borderStyle: 'solid',
      borderWidth: 1
    }}>
      <Typography fontSize={12} style={{ lineHeight: 20 }}>
        {media.name}
        {media.ext}
      </Typography>
      <Typography
        fontSize={12}
        style={{ lineHeight: 20, color: 'darkGray' }}>
        {media?.size ? formatBytes(media?.size) : 'Calculating size...'}
      </Typography>
      {renderActionIndicator()}
    </View>
  )
}