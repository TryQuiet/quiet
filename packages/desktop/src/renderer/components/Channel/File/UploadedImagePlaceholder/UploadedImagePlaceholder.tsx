import { CircularProgress } from '@mui/material'
import { styled } from '@mui/material/styles'
import { DownloadStatus, DownloadState } from '@quiet/types'
import { formatBytes } from '@quiet/state-manager'
import React from 'react'
import imageIcon from '../../../../static/images/imageIcon.svg'
import theme from '../../../../theme'
import Icon from '../../../ui/Icon/Icon'
import Tooltip from '../../../ui/Tooltip/Tooltip'

const PREFIX = 'UploadedImagePlaceholder'

const classes = {
  placeholderWrapper: `${PREFIX}placeholderWrapper`,
  placeholder: `${PREFIX}placeholder`,
  placeholderIcon: `${PREFIX}placeholderIcon`,
  fileName: `${PREFIX}fileName`,
  icon: `${PREFIX}icon`
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
  downloadStatus?: DownloadStatus
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

  const renderIcon = () => {
    switch (downloadState) {
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
              variant='determinate'
              size={18}
              thickness={4}
              value={downloadProgress?.size && (downloadProgress.downloaded / downloadProgress.size) * 100} // TODO: check
              style={{ color: theme.palette.colors.lightGray }}
            />
          </>
        )
      default:
        return (
          <CircularProgress
            variant='indeterminate'
            size={18}
            thickness={4}
            style={{ position: 'absolute', color: theme.palette.colors.lightGray }}
          />
        )
    }
  }

  return (
    <Root data-testid={`${cid}-imagePlaceholder`}>
      <UploadedFilename fileName={`${name}${ext}`} />

      <div className={classes.placeholder} style={{ width: width, aspectRatio: '' + imageWidth / imageHeight }} >
        <Tooltip
          title={
            downloadState === DownloadState.Downloading &&
              downloadProgress &&
              downloadProgress.size !== undefined &&
              downloadProgress?.transferSpeed !== -1
              ? `(${Math.floor(downloadProgress.downloaded / downloadProgress.size * 100)}%) ${formatBytes(downloadProgress.transferSpeed)}ps`
              : ''
          }
          placement='top'>
          <div style={{ display: 'flex', width: 'fit-content' }}>
            <Icon src={imageIcon} className={classes.placeholderIcon} />
            <div className={classes.icon}>{renderIcon()}</div>
          </div>
        </Tooltip>
      </div>
    </Root>
  )
}

export default UploadedImagePlaceholder
