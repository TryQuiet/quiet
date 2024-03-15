import React, { useEffect, useState } from 'react'
import classNames from 'classnames'
import { styled } from '@mui/material/styles'

import { DownloadStatus, FileMetadata } from '@quiet/types'

import { UseModalType } from '../../../../containers/hooks'
import UploadedFileModal from './UploadedImagePreview'
import { UploadedFilename, UploadedImagePlaceholder } from '../UploadedImagePlaceholder/UploadedImagePlaceholder'

const PREFIX = 'UploadedImage'

const classes = {
  image: `${PREFIX}image`,
  container: `${PREFIX}container`,
  pending: `${PREFIX}pending`,
  unsent: `${PREFIX}unsent`,
}

const Root = styled('div')(() => ({
  [`& .${classes.image}`]: {
    maxWidth: '100%',
    display: 'block',
  },

  [`& .${classes.container}`]: {
    maxWidth: '400px',
    cursor: 'pointer',
  },

  [`& .${classes.pending}`]: {
    opacity: 0.5,
  },

  [`& .${classes.unsent}`]: {
    opacity: 0.5,
  },
}))

export interface UploadedImageProps {
  media: FileMetadata
  uploadedFileModal?: UseModalType<{
    src: string
  }>

  downloadStatus?: DownloadStatus
  isUnsent?: boolean
}

export const UploadedImage: React.FC<UploadedImageProps> = ({ media, uploadedFileModal, downloadStatus, isUnsent }) => {
  const [showImage, setShowImage] = useState<boolean>(false)
  const { cid, path, name, ext } = media

  const imageWidth = media.width
  const imageHeight = media.height

  useEffect(() => {
    if (uploadedFileModal?.open) {
      setShowImage(false)
    }
  }, [uploadedFileModal?.open])

  useEffect(() => {
    if (showImage && path) {
      uploadedFileModal?.handleOpen({
        src: path,
      })
    }
  }, [showImage])

  if (!imageWidth || !imageHeight) return null
  const width = imageWidth >= 400 ? 400 : imageWidth

  return (
    <Root>
      {path ? (
        <>
          <div
            className={classNames({
              [classes.container]: true,
              [classes.pending]: showImage,
              [classes.unsent]: isUnsent,
            })}
            onClick={() => {
              setShowImage(true)
            }}
          >
            <div className={classes.image} data-testid={`${cid}-imageVisual`}>
              <UploadedFilename fileName={`${name}${ext}`} />
              <img
                className={classes.image}
                style={{ width: width, aspectRatio: '' + imageWidth / imageHeight }}
                src={path}
              />
            </div>
          </div>
          {uploadedFileModal && <UploadedFileModal {...uploadedFileModal} uploadedFileModal={uploadedFileModal} />}
        </>
      ) : (
        <UploadedImagePlaceholder
          cid={cid}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          name={name}
          ext={ext}
          downloadStatus={downloadStatus}
        />
      )}
    </Root>
  )
}

export default UploadedImage
