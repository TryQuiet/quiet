import { CircularProgress, makeStyles, Theme } from '@mui/material'
import React from 'react'
import imageIcon from '../../../../static/images/imageIcon.svg'
import Icon from '../../../ui/Icon/Icon'

const useStyles = makeStyles<Theme>(theme => ({
  placeholderWrapper: {
    maxWidth: '400px',
    height: '100%'
  },
  placeholder: {
    display: 'flex',
    alignContent: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: '50px',
    minHeight: '50px',
    backgroundColor: '#e0e0e0'
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

export interface UploadedImagePlaceholderProps {
  cid: string
  imageWidth: number
  imageHeight: number
  name: string
  ext: string
}

export const UploadedImagePlaceholder: React.FC<UploadedImagePlaceholderProps> = ({
  cid,
  imageWidth,
  imageHeight,
  name,
  ext
}) => {
  const classes = useStyles({})

  const width = imageWidth >= 400 ? 400 : imageWidth

  return (
    <div className={classes.placeholderWrapper} data-testid={`${cid}-imagePlaceholder`}>
      <UploadedFilename fileName={`${name}${ext}`}/>
      <div className={classes.placeholder} style={{ width: width, aspectRatio: '' + imageWidth / imageHeight }} >
        <Icon src={imageIcon} className={classes.placeholderIcon}/>
        <CircularProgress color='inherit' size={16} disableShrink={true} />
      </div>
    </div>
  )
}

export default UploadedImagePlaceholder
