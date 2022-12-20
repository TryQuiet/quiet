import { CircularProgress } from '@mui/material'
import { styled } from '@mui/material/styles'
import React from 'react'
import imageIcon from '../../../../static/images/imageIcon.svg'
import Icon from '../../../ui/Icon/Icon'

const PREFIX = 'UploadedImagePlaceholder'

const classes = {
  placeholderWrapper: `${PREFIX}placeholderWrapper`,
  placeholder: `${PREFIX}placeholder`,
  placeholderIcon: `${PREFIX}placeholderIcon`,
  fileName: `${PREFIX}fileName`
}

const Root = styled('div')(() => ({
  maxWidth: '400px',
  height: '100%',

  [`& .${classes.placeholder}`]: {
    display: 'flex',
    alignContent: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: '50px',
    minHeight: '50px',
    backgroundColor: '#e0e0e0'
  },

  [`& .${classes.placeholderIcon}`]: {
    marginRight: '0.5em'
  }
}))

const StyledUploadedFilename = styled('p')((
  {
    theme
  }
) => ({
  color: theme.palette.colors.darkGray,
  margin: 0
}))

interface UploadedFilenameProps {
  fileName: string
}

export const UploadedFilename: React.FC<UploadedFilenameProps> = ({
  fileName
}) => {
  return (
    <StyledUploadedFilename>{fileName}</StyledUploadedFilename>
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
  const width = imageWidth >= 400 ? 400 : imageWidth

  return (
    <Root data-testid={`${cid}-imagePlaceholder`}>
      <UploadedFilename fileName={`${name}${ext}`}/>
      <div className={classes.placeholder} style={{ width: width, aspectRatio: '' + imageWidth / imageHeight }} >
        <Icon src={imageIcon} className={classes.placeholderIcon}/>
        <CircularProgress color='inherit' size={16} disableShrink={true} />
      </div>
    </Root>
  )
}

export default UploadedImagePlaceholder
