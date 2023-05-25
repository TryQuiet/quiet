import React, { useEffect, useState } from 'react'
import { styled } from '@mui/material/styles'
import { DisplayableMessage, DownloadStatus, FileMetadata } from '@quiet/state-manager'
import { UseModalTypeWrapper } from '../../../../containers/hooks'
import UploadedFileModal from './UploadedImagePreview'
import { UploadedFilename, UploadedImagePlaceholder } from '../UploadedImagePlaceholder/UploadedImagePlaceholder'

const PREFIX = 'UploadedImage'

const classes = {
  image: `${PREFIX}image`,
  container: `${PREFIX}container`
}

const Root = styled('div')(() => ({
  [`& .${classes.image}`]: {
    maxWidth: '100%',
    display: 'block'
  },

  [`& .${classes.container}`]: {
    maxWidth: '400px',
    cursor: 'pointer'
  }
}))

export interface UploadedImageProps {
  media: FileMetadata
  uploadedFileModal?: ReturnType<
  UseModalTypeWrapper<{
    src: string
  }>['types']
  >
  downloadStatus: DownloadStatus
}

export const UploadedImage: React.FC<UploadedImageProps> = ({ media, uploadedFileModal, downloadStatus }) => {
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
        src: path
      })
    }
  }, [showImage])

  if (!imageWidth || !imageHeight) return null
  const width = imageWidth >= 400 ? 400 : imageWidth

  return (
    (<Root>
      {path ? (
        <>
          <div
            className={classes.container}
            onClick={() => {
              setShowImage(true)
            }}>
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
    </Root>)
  )
}

export default UploadedImage
