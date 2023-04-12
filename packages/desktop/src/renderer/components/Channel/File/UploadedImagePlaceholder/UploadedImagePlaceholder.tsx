import { CircularProgress } from '@mui/material'
import { styled } from '@mui/material/styles'
import { DownloadStatus, DownloadState, formatBytes } from '@quiet/state-manager'
import React from 'react'
import imageIcon from '../../../../static/images/imageIcon.svg'
import Icon from '../../../ui/Icon/Icon'
import Tooltip from '../../../ui/Tooltip/Tooltip'

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
  downloadStatus: DownloadStatus
}

export const UploadedImagePlaceholder: React.FC<UploadedImagePlaceholderProps> = ({
  cid,
  imageWidth,
  imageHeight,
  name,
  ext,
  downloadStatus
}) => {
  const width = imageWidth >= 400 ? 400 : imageWidth

  const downloadState = downloadStatus?.downloadState
  const downloadProgress = downloadStatus?.downloadProgress

  return (
    <Root data-testid={`${cid}-imagePlaceholder`}>
      <UploadedFilename fileName={`${name}${ext}`} />

      <div className={classes.placeholder} style={{ width: width, aspectRatio: '' + imageWidth / imageHeight }} >
        <Tooltip
          title={
            downloadState === DownloadState.Downloading &&
              downloadProgress &&
              downloadProgress?.transferSpeed !== -1
              ? `(${Math.floor(downloadProgress.downloaded / downloadProgress.size * 100)}%) ${formatBytes(downloadProgress.transferSpeed)}ps`
              : ''
          }
          placement='top'>
          <div>
            <Icon src={imageIcon} className={classes.placeholderIcon} />
            <CircularProgress color='inherit' size={16} disableShrink={true} />
          </div>
        </Tooltip>
      </div>
    </Root>
  )
}

export default UploadedImagePlaceholder
