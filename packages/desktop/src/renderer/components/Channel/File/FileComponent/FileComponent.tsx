import React, { useState } from 'react'
import { CircularProgress, makeStyles, Typography } from '@material-ui/core'
import { DisplayableMessage, DownloadState, DownloadStatus } from '@quiet/state-manager'
import theme from '../../../../theme'
import Icon from '../../../ui/Icon/Icon'
import fileIcon from '../../../../static/images/fileIcon.svg'
import clockIconGray from '../../../../static/images/clockIconGray.svg'
import downloadIcon from '../../../../static/images/downloadIcon.svg'
import downloadIconGray from '../../../../static/images/downloadIconGray.svg'
import folderIcon from '../../../../static/images/folderIcon.svg'
import folderIconGray from '../../../../static/images/folderIconGray.svg'
import checkGreen from '../../../../static/images/checkGreen.svg'
import Tooltip from '../../../ui/Tooltip/Tooltip'
import { formatBytes } from '../../../../../utils/functions/formatBytes'

const useStyles = makeStyles(theme => ({
  border: {
    maxWidth: '100%',
    marginTop: '8px',
    padding: '16px',
    backgroundColor: theme.palette.colors.white,
    borderRadius: '8px',
    border: `1px solid ${theme.palette.colors.veryLightGray}`
  },
  icon: {
    minWidth: '40px',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#F0F0F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fileIcon: {
    width: '16px',
    height: '20px'
  },
  filename: {
    marginLeft: '16px'
  },
  actionIcon: {
    width: '15px'
  },
  actionIndicator: {
    display: 'flex',
    width: 'fit-content',
    cursor: 'pointer'
  }
}))

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
  action?: () => void
}> = ({ regular, hover, action }) => {
  const [over, setOver] = useState<boolean>()

  const classes = useStyles({})

  const onMouseOver = () => {
    setOver(true)
  }

  const onMouseOut = () => {
    setOver(false)
  }

  return (
    <div onClick={action} onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
      {/* Regular state */}
      {!over && (
        <div className={classes.actionIndicator}>
          <Icon src={regular.icon} className={classes.actionIcon} />
          <Typography variant={'body2'} style={{ color: regular.color, marginLeft: '8px' }}>
            {regular.label}
          </Typography>
        </div>
      )}
      {/* Hovered state */}
      {over && (
        <div className={classes.actionIndicator}>
          <Icon src={hover.icon} className={classes.actionIcon} />
          <Typography variant={'body2'} style={{ color: hover.color, marginLeft: '8px' }}>
            {hover.label}
          </Typography>
        </div>
      )}
    </div>
  )
}

export interface FileComponentProps {
  message: DisplayableMessage
  downloadStatus: DownloadStatus
  download?: () => void
  cancel?: () => void
  show?: () => void
}

export const FileComponent: React.FC<FileComponentProps> = ({
  message,
  downloadStatus,
  download,
  cancel,
  show
}) => {
  const classes = useStyles({})

  const { cid, name, ext } = message.media

  const downloadState = downloadStatus.downloadState
  const downloadProgress = downloadStatus.downloadProgress

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
            action={show}
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
            action={download}
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
            // hover={{
            //   label: 'Cancel download',
            //   color: theme.palette.colors.lushSky,
            //   icon: cancelIcon
            // }}
            // action={cancel}
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
            // hover={{
            //   label: 'Cancel download',
            //   color: theme.palette.colors.lushSky,
            //   icon: cancelIcon
            // }}
            // action={cancel}
          />
        )
      case DownloadState.Canceled:
        return (
          <ActionIndicator
            regular={{
              label: 'Canceled',
              color: theme.palette.colors.greenDark,
              icon: checkGreen
            }}
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
            action={show}
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
            ? `${formatBytes(downloadProgress.transferSpeed)}ps`
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
              {message.media?.size ? formatBytes(message.media?.size) : 'Calculating...'}
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
