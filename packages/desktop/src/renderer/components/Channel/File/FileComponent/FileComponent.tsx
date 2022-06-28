import React, { useState } from 'react'
import { makeStyles, Typography } from '@material-ui/core'
import { DisplayableMessage } from '@quiet/state-manager'
import { FileDownloadState } from '../File.consts'
import theme from '../../../../theme'
import Icon from '../../../ui/Icon/Icon'
import fileIcon from '../../../../static/images/fileIcon.svg'
import downloadIcon from '../../../../static/images/downloadIcon.svg'
import downloadIconGray from '../../../../static/images/downloadIconGray.svg'
import folderIcon from '../../../../static/images/folderIcon.svg'
import folderIconGray from '../../../../static/images/folderIconGray.svg'
import cancelIconGray from '../../../../static/images/cancelIconGray.svg'
import checkGreen from '../../../../static/images/checkGreen.svg'

const useStyles = makeStyles(theme => ({
  border: {
    maxWidth: '100%',
    padding: '16px',
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
  const [over, setOver] = useState<boolean>(false)

  const classes = useStyles({})

  const onMouseOver = () => {
    if (!hover) return // Ignore if there's no hover state specified
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
  state?: FileDownloadState
  download?: () => void
  cancel?: () => void
  show?: () => void
}

export const FileComponent: React.FC<FileComponentProps> = ({ message, state, download, cancel, show }) => {
  const classes = useStyles({})

  const { cid, path, name, ext } = message.media

  return (
    <div className={classes.border} data-testid={`${cid}-fileComponent`}>
      <div style={{ display: 'flex' }}>
        <div className={classes.icon}>
          <Icon src={fileIcon} className={classes.fileIcon} />
        </div>
        <div className={classes.filename}>
          <Typography variant={'h5'} style={{ lineHeight: '20px' }}>
            {name}
            {ext}
          </Typography>
          <Typography
            variant={'body2'}
            style={{ lineHeight: '20px', color: theme.palette.colors.darkGray }}>
            16 MB
          </Typography>
        </div>
      </div>
      <div style={{ paddingTop: '16px', width: 'fit-content', display: state ? 'block' : 'none' }}>
        {state === FileDownloadState.Ready && (
          <ActionIndicator
            regular={{
              label: 'Download file',
              color: theme.palette.colors.lushSky,
              icon: downloadIcon
            }}
            action={download}
          />
        )}
        {state === FileDownloadState.Downloading && (
          <ActionIndicator
            regular={{
              label: 'Downloading...',
              color: theme.palette.colors.darkGray,
              icon: downloadIconGray
            }}
            hover={{
              label: 'Cancel download',
              color: theme.palette.colors.darkGray,
              icon: cancelIconGray
            }}
            action={cancel}
          />
        )}
        {state === FileDownloadState.Canceled && (
          <ActionIndicator
            regular={{
              label: 'Canceled',
              color: theme.palette.colors.greenDark,
              icon: checkGreen
            }}
          />
        )}
        {state === FileDownloadState.Downloaded && (
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
        )}
      </div>
    </div>
  )
}

export default FileComponent
