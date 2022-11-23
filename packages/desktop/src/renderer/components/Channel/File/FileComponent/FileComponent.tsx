import React, { useState } from 'react'
import { styled } from '@mui/material/styles';
import { CircularProgress, makeStyles, Typography } from '@mui/material'
import { DisplayableMessage, DownloadState, DownloadStatus, FileMetadata, CancelDownload, formatBytes } from '@quiet/state-manager'
import theme from '../../../../theme'
import Icon from '../../../ui/Icon/Icon'
import fileIcon from '../../../../static/images/fileIcon.svg'
import clockIconGray from '../../../../static/images/clockIconGray.svg'
import downloadIcon from '../../../../static/images/downloadIcon.svg'
import downloadIconGray from '../../../../static/images/downloadIconGray.svg'
import folderIcon from '../../../../static/images/folderIcon.svg'
import folderIconGray from '../../../../static/images/folderIconGray.svg'
import cancelIconGray from '../../../../static/images/cancelIconGray.svg'
import cancelIconRed from '../../../../static/images/cancelIconRed.svg'
import pauseIconGray from '../../../../static/images/pauseIconGray.svg'
import Tooltip from '../../../ui/Tooltip/Tooltip'

const PREFIX = 'FileComponent';

const classes = {
  border: `${PREFIX}-border`,
  icon: `${PREFIX}-icon`,
  fileIcon: `${PREFIX}-fileIcon`,
  filename: `${PREFIX}-filename`,
  actionIcon: `${PREFIX}-actionIcon`,
  actionIndicator: `${PREFIX}-actionIndicator`
};

const Root = styled('div')((
  {
    theme
  }
) => ({
  [`& .${classes.border}`]: {
    maxWidth: '100%',
    marginTop: '8px',
    padding: '16px',
    backgroundColor: theme.palette.colors.white,
    borderRadius: '8px',
    border: `1px solid ${theme.palette.colors.veryLightGray}`
  },

  [`& .${classes.icon}`]: {
    minWidth: '40px',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#F0F0F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  [`& .${classes.fileIcon}`]: {
    width: '16px',
    height: '20px'
  },

  [`& .${classes.filename}`]: {
    marginLeft: '16px'
  },

  [`& .${classes.actionIcon}`]: {
    width: '15px'
  },

  [`&.${classes.actionIndicator}`]: {
    display: 'flex',
    width: 'fit-content'
  }
}));

const ActionIndicator: React.FC<{
  regular: {
    label: string
    color: string
    icon: any
  }
  hover?: {
    label: string
    color: string
    icon: any
  }
  action?: (...args: any) => void
}> = ({ regular, hover, action }) => {
  const [over, setOver] = useState<boolean>()



  const onMouseOver = () => {
    setOver(true)
  }

  const onMouseOut = () => {
    setOver(false)
  }

  const renderIndicator = () => {
    if (over && hover) {
      return <>
        {/* Hovered state */}
        <Root className={classes.actionIndicator}>
          <Icon src={hover.icon} className={classes.actionIcon} />
          <Typography variant={'body2'} style={{ color: hover.color, marginLeft: '8px' }}>
            {hover.label}
          </Typography>
        </Root>
      </>;
    } else {
      return (
        <>
          {/* Hovered state */}
          <div className={classes.actionIndicator}>
            <Icon src={regular.icon} className={classes.actionIcon} />
            <Typography variant={'body2'} style={{ color: regular.color, marginLeft: '8px' }}>
              {regular.label}
            </Typography>
          </div>
        </>
      )
    }
  }

  return (
    <div
      onClick={action}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      style={{ cursor: hover ? 'pointer' : 'default' }}>
      {renderIndicator()}
    </div>
  )
}

export interface FileComponentProps {
  message: DisplayableMessage
  downloadStatus?: DownloadStatus
}

export interface FileActionsProps {
  openContainingFolder?: (path: string) => void
  downloadFile?: (media: FileMetadata) => void
  cancelDownload?: (cancelDownload: CancelDownload) => void
}

export const FileComponent: React.FC<FileComponentProps & FileActionsProps> = ({
  message,
  downloadStatus,
  openContainingFolder,
  downloadFile,
  cancelDownload
}) => {


  const { cid, path, name, ext } = message.media

  const downloadState = downloadStatus?.downloadState
  const downloadProgress = downloadStatus?.downloadProgress

  const renderIcon = () => {
    switch (downloadState) {
      case DownloadState.Uploading:
        return (
          <CircularProgress
            variant='indeterminate'
            size={18}
            thickness={4}
            style={{ position: 'absolute', color: theme.palette.colors.lightGray }}
          />
        )
      case DownloadState.Downloading:
        return (
          <>
            <CircularProgress
              variant='determinate'
              size={18}
              thickness={4}
              value={100}
              style={{ position: 'absolute', color: theme.palette.colors.gray }}
            />
            <CircularProgress
              variant='static'
              size={18}
              thickness={4}
              value={(downloadProgress.downloaded / downloadProgress.size) * 100}
              style={{ color: theme.palette.colors.lightGray }}
            />
          </>
        )
      default:
        return <Icon src={fileIcon} className={classes.fileIcon} />
    }
  }

  const _openContainingFolder = () => {
    openContainingFolder(path)
  }

  const _downloadFile = () => {
    downloadFile(message.media)
  }

  const _cancelDownload = () => {
    cancelDownload({
      mid: message.id,
      cid: cid
    })
  }

  const renderActionIndicator = () => {
    switch (downloadState) {
      case DownloadState.Uploading:
        return (
          <ActionIndicator
            regular={{
              label: 'Uploading...',
              color: theme.palette.colors.darkGray,
              icon: downloadIconGray
            }}
          />
        )
      case DownloadState.Hosted:
        return (
          <ActionIndicator
            regular={{
              label: 'Show in folder',
              color: theme.palette.colors.darkGray,
              icon: folderIconGray
            }}
            hover={{
              label: 'Show in folder',
              color: theme.palette.colors.lushSky,
              icon: folderIcon
            }}
            action={_openContainingFolder}
          />
        )
      case DownloadState.Ready:
        return (
          <ActionIndicator
            regular={{
              label: 'Download file',
              color: theme.palette.colors.lushSky,
              icon: downloadIcon
            }}
            hover={{
              label: 'Download file',
              color: theme.palette.colors.lushSky,
              icon: downloadIcon
            }}
            action={_downloadFile}
          />
        )
      case DownloadState.Queued:
        return (
          <ActionIndicator
            regular={{
              label: 'Queued for download',
              color: theme.palette.colors.darkGray,
              icon: clockIconGray
            }}
          />
        )
      case DownloadState.Downloading:
        return (
          <ActionIndicator
            regular={{
              label: 'Downloading...',
              color: theme.palette.colors.darkGray,
              icon: downloadIconGray
            }}
            hover={{
              label: 'Cancel download',
              color: theme.palette.colors.hotRed,
              icon: cancelIconRed
            }}
            action={_cancelDownload}
          />
        )
      case DownloadState.Canceling:
        return (
          <ActionIndicator
            regular={{
              label: 'Canceling...',
              color: theme.palette.colors.darkGray,
              icon: pauseIconGray
            }}
          />
        )
      case DownloadState.Canceled:
        return (
          <ActionIndicator
            regular={{
              label: 'Canceled',
              color: theme.palette.colors.darkGray,
              icon: cancelIconGray
            }}
            hover={{
              label: 'Download file',
              color: theme.palette.colors.lushSky,
              icon: downloadIcon
            }}
            action={_downloadFile}
          />
        )
      case DownloadState.Completed:
        return (
          <ActionIndicator
            regular={{
              label: 'Show in folder',
              color: theme.palette.colors.darkGray,
              icon: folderIconGray
            }}
            hover={{
              label: 'Show in folder',
              color: theme.palette.colors.lushSky,
              icon: folderIcon
            }}
            action={_openContainingFolder}
          />
        )
      case DownloadState.Malicious:
        return (
          <ActionIndicator
            regular={{
              label: 'File not valid. Download canceled.',
              color: theme.palette.colors.hotRed,
              icon: cancelIconRed
            }}
          />
        )
      default:
        return <></>
    }
  }

  return (
    <div className={classes.border} data-testid={`${cid}-fileComponent`}>
      <Tooltip
        title={
          downloadState === DownloadState.Downloading &&
          downloadProgress &&
          downloadProgress?.transferSpeed !== -1
            ? `(${Math.floor(downloadProgress.downloaded / downloadProgress.size * 100)}%) ${formatBytes(downloadProgress.transferSpeed)}ps`
            : ''
        }
        placement='top'>
        <div style={{ display: 'flex', width: 'fit-content' }}>
          <div className={classes.icon}>{renderIcon()}</div>
          <div className={classes.filename}>
            <Typography variant={'h5'} style={{ lineHeight: '20px' }}>
              {name}
              {ext}
            </Typography>
            <Typography
              variant={'body2'}
              style={{ lineHeight: '20px', color: theme.palette.colors.darkGray }}>
              {message.media?.size ? formatBytes(message.media?.size) : 'Calculating size...'}
            </Typography>
          </div>
        </div>
      </Tooltip>
      <div
        style={{
          paddingTop: '16px',
          width: 'fit-content',
          display: downloadState ? 'block' : 'none'
        }}>
        {renderActionIndicator()}
      </div>
    </div>
  )
}

export default FileComponent
