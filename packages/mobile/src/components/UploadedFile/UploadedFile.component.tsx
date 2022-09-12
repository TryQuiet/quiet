import { DownloadState, formatBytes } from '@quiet/state-manager'
import React, { FC } from 'react'
import {View} from 'react-native'
import {TouchableWithoutFeedback} from 'react-native-gesture-handler'
import { Typography } from '../Typography/Typography.component'
import { UploadedFileProps } from './UploadedFile.types'

interface ActionIndicatorProps {
  label: string
  action?: () => void
}

const ActionIndicator: FC<ActionIndicatorProps> = ({
  label,
  action
}) => {
  return <TouchableWithoutFeedback onPress={action}>
    <Typography fontSize={14}>{label}</Typography>
  </TouchableWithoutFeedback>
}

export const UploadedFile: FC<UploadedFileProps> = ({ media, downloadStatus }) => {
  const downloadState = downloadStatus?.downloadState
  console.log('Uploadeditem', media.name, downloadState)

  const renderActionIndicator = () => {
    switch (downloadState) {
      case DownloadState.Uploading:
        return (
          <ActionIndicator
          label='Uploading...'
            // regular={{
            //   label: 'Uploading...',
            //   color: theme.palette.colors.darkGray,
            //   icon: downloadIconGray
            // }}
          />
        )
      case DownloadState.Hosted:
        return (
          <ActionIndicator
            label='Show in folder'
            // regular={{
            //   label: 'Show in folder',
            //   color: theme.palette.colors.darkGray,
            //   icon: folderIconGray
            // }}
            // hover={{
            //   label: 'Show in folder',
            //   color: theme.palette.colors.lushSky,
            //   icon: folderIcon
            // }}
            action={() => {console.log('Show in containing folder')}}
          />
        )
      case DownloadState.Ready:
        return (
          <ActionIndicator
          label='Download file'
            // regular={{
            //   label: 'Download file',
            //   color: theme.palette.colors.lushSky,
            //   icon: downloadIcon
            // }}
            // hover={{
            //   label: 'Download file',
            //   color: theme.palette.colors.lushSky,
            //   icon: downloadIcon
            // }}
            action={() => {console.log('Download file')}}
          />
        )
      case DownloadState.Queued:
        return (
          <ActionIndicator
            label='Queued for download'
            // regular={{
            //   label: 'Queued for download',
            //   color: theme.palette.colors.darkGray,
            //   icon: clockIconGray
            // }}
          />
        )
      case DownloadState.Downloading:
        return (
          <ActionIndicator
            label='Downloading...'
            // regular={{
            //   label: 'Downloading...',
            //   color: theme.palette.colors.darkGray,
            //   icon: downloadIconGray
            // }}
            // hover={{
            //   label: 'Cancel download',
            //   color: theme.palette.colors.hotRed,
            //   icon: cancelIconRed
            // }}
            action={() => {console.log('_cancelDownload')}}
          />
        )
      case DownloadState.Canceling:
        return (
          <ActionIndicator
            label={'Canceling...'}
            // regular={{
            //   label: 'Canceling...',
            //   color: theme.palette.colors.darkGray,
            //   icon: pauseIconGray
            // }}
          />
        )
      case DownloadState.Canceled:
        return (
          <ActionIndicator
          label='Canceled. Download file'
            // regular={{
            //   label: 'Canceled',
            //   color: theme.palette.colors.darkGray,
            //   icon: cancelIconGray
            // }}
            // hover={{
            //   label: 'Download file',
            //   color: theme.palette.colors.lushSky,
            //   icon: downloadIcon
            // }}
            action={() => {console.log('_downloadFile')}}
          />
        )
      case DownloadState.Completed:
        return (
          <ActionIndicator
            label='Show in folder'
            // regular={{
            //   label: 'Show in folder',
            //   color: theme.palette.colors.darkGray,
            //   icon: folderIconGray
            // }}
            // hover={{
            //   label: 'Show in folder',
            //   color: theme.palette.colors.lushSky,
            //   icon: folderIcon
            // }}
            action={() => {console.log('_openContainingFolder')}}
          />
        )
      case DownloadState.Malicious:
        return (
          <ActionIndicator
            label='File not valid. Download canceled.'
            // regular={{
            //   label: 'File not valid. Download canceled.',
            //   color: theme.palette.colors.hotRed,
            //   icon: cancelIconRed
            // }}
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