import React from 'react'
import { makeStyles, Typography } from '@material-ui/core'
import { DisplayableMessage } from '@quiet/state-manager'
import { FileDownloadState } from '../File.consts'
import theme from '../../../../theme'
import Icon from '../../../ui/Icon/Icon'
import fileIcon from '../../../../static/images/fileIcon.svg'
import downloadIcon from '../../../../static/images/downloadIcon.svg'
import downloadIconGray from '../../../../static/images/downloadIconGray.svg'
import folderIconGray from '../../../../static/images/folderIconGray.svg'

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
    paddingTop: '16px'
  }
}))

export interface FileComponentProps {
  message: DisplayableMessage
  state?: FileDownloadState
}

const ActionIndicator: React.FC<{
  label: string
  color: string
  icon
}> = ({ label, color, icon }) => {
  const classes = useStyles({})
  return (
    <div style={{ display: 'flex' }}>
      <Icon src={icon} className={classes.actionIcon} />
      <Typography variant={'body2'} style={{ color: color, marginLeft: '8px' }}>
        {label}
      </Typography>
    </div>
  )
}

export const FileComponent: React.FC<FileComponentProps> = ({ message, state }) => {
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
      <div className={classes.actionIndicator} style={{ display: state ? 'block' : 'none' }}>
        {state === FileDownloadState.Ready && (
          <ActionIndicator
            label={'Download file'}
            color={theme.palette.colors.lushSky}
            icon={downloadIcon}
          />
        )}
        {state === FileDownloadState.Downloading && (
          <ActionIndicator
            label={'Downloading...'}
            color={theme.palette.colors.darkGray}
            icon={downloadIconGray}
          />
        )}
        {state === FileDownloadState.Downloaded && (
          <ActionIndicator
            label={'Show in folder'}
            color={theme.palette.colors.darkGray}
            icon={folderIconGray}
          />
        )}
      </div>
    </div>
  )
}

export default FileComponent
