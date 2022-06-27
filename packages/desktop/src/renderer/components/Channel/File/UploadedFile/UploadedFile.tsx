import React from 'react'
import { makeStyles, Typography } from '@material-ui/core'
import { DisplayableMessage } from '@quiet/state-manager'
import { DEFAULT_FILE_HEIGHT, DEFAULT_FILE_WIDTH } from '../File.consts'
import fileIcon from '../../../../static/images/fileIcon.svg'
import Icon from '../../../ui/Icon/Icon'

const useStyles = makeStyles(() => ({
  file: {
    maxWidth: '100%',
    display: 'flex',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #F0F0F0'
  },
  iconWrapper: {
    minWidth: '40px',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#F0F0F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  filenameWrapper: {
    marginLeft: '16px'
  },
  icon: {
    width: '16px',
    height: '20px'
  },
  container: {
    maxWidth: '400px',
    cursor: 'pointer'
  }
}))

export interface UploadedFileProps {
  message: DisplayableMessage
}

export const UploadedFile: React.FC<UploadedFileProps> = ({ message }) => {
  const classes = useStyles({})

  const { cid, path, name, ext } = message.media

  const imageWidth = message.media?.width || DEFAULT_FILE_WIDTH
  const imageHeight = message.media?.height || DEFAULT_FILE_HEIGHT

  const width = imageWidth >= 400 ? 400 : imageWidth

  return (
    <>
      {path ? (
        <div className={classes.file} data-testid={`${cid}-imageVisual`}>
          <div className={classes.iconWrapper}>
            <Icon src={fileIcon} className={classes.icon}/>
          </div>
          <div className={classes.filenameWrapper}>
            <Typography variant={'h5'} style={{ lineHeight: '20px' }}>{name}{ext}</Typography>
            <Typography variant={'body2'} style={{ lineHeight: '20px', color: '#7F7F7F' }}>16 MB</Typography>
          </div>
        </div>
      ) : (
        <></>
        // <UploadedFilePlaceholder
        //   cid={cid}
        //   name={name}
        //   ext={ext}
        // />
      )}
    </>
  )
}

export default UploadedFile
