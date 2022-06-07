import { CircularProgress, makeStyles, Theme } from '@material-ui/core'
import React from 'react'
import imagePlaceholderIcon from '../../../static/images/imagePlaceholderIcon.svg'
import Icon from '../../ui/Icon/Icon'

const useStyles = makeStyles<Theme>(theme => ({
  placeholderWrapper: {
    maxWidth: '400px',
    minHeight: '60px',
    height: '100%'
  },
  placeholder: {
    display: 'flex',
    alignContent: 'center',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  placeholderIcon: {
    marginRight: '0.5em'
  },
  fileName: {
    color: theme.palette.colors.darkGray,
    margin: 0
  }
}))

interface UploadedFilenameProps {
  fileName: string
}

export const UploadedFilename: React.FC<UploadedFilenameProps> = ({
  fileName
}) => {
  const classes = useStyles({})
  return (
    <p className={classes.fileName}>{fileName}</p>
  )
}

interface UploadedFilePlaceholderProps {
  imageWidth: number,
  imageHeight: number,
  fileName: string
}

export const UploadedFilePlaceholder: React.FC<UploadedFilePlaceholderProps> = ({
  imageWidth,
  imageHeight,
  fileName
 }) => {
  const classes = useStyles({})
  return (
    <div className={classes.placeholderWrapper} style={{aspectRatio: '' + imageWidth / imageHeight }} data-testid={'imagePlaceholder'} >
      <UploadedFilename fileName={fileName}/>
      <div className={classes.placeholder}>
        <Icon src={imagePlaceholderIcon} className={classes.placeholderIcon}/>
        <CircularProgress color='inherit' size={16} />
      </div>
    </div>
  )
}