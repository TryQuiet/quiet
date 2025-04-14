import React, { useEffect, useState } from 'react'
import { styled } from '@mui/material/styles'
import { DownloadStatus, FileMetadata } from '@quiet/types'
import { UseModalType } from '../../../../containers/hooks'
import FileAttachmentModal from './ImageAttachmentPreview'
import {
  FileAttachmentname,
  ImageAttachmentPlaceholder,
} from '../ImageAttachmentPlaceholder/ImageAttachmentPlaceholder'

const PREFIX = 'ImageAttachment'

const classes = {
  image: `${PREFIX}image`,
  container: `${PREFIX}container`,
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
}))

export interface ImageAttachmentProps {
  media: FileMetadata
  fileAttachmentModal?: UseModalType<{
    src: string
  }>

  downloadStatus?: DownloadStatus
}

export const ImageAttachment: React.FC<ImageAttachmentProps> = ({ media, fileAttachmentModal, downloadStatus }) => {
  const [showImage, setShowImage] = useState<boolean>(false)
  const { cid, path, name, ext } = media

  const imageWidth = media.width
  const imageHeight = media.height

  useEffect(() => {
    if (fileAttachmentModal?.open) {
      setShowImage(false)
    }
  }, [fileAttachmentModal?.open])

  useEffect(() => {
    if (showImage && path) {
      fileAttachmentModal?.handleOpen({
        src: path,
      })
    }
  }, [showImage])

  // Show a spinner when width/height are not available (image is still processing i.e. compressing, hashing, etc)
  if (!imageWidth || !imageHeight) {
    return (
      <Root>
        <div className={classes.container}>
          <div className={classes.image}>
            <ImageAttachmentPlaceholder
              cid={cid || ''}
              imageWidth={400}
              imageHeight={300}
              name={name}
              ext={ext}
              downloadStatus={downloadStatus}
            />
          </div>
        </div>
      </Root>
    )
  }
  const width = imageWidth >= 400 ? 400 : imageWidth

  return (
    <Root>
      {path ? (
        <>
          <div
            className={classes.container}
            onClick={() => {
              setShowImage(true)
            }}
          >
            <div className={classes.image} data-testid={`${cid}-imageVisual`}>
              <FileAttachmentname fileName={`${name}${ext}`} />
              <img
                className={classes.image}
                style={{ width: width, aspectRatio: '' + imageWidth / imageHeight }}
                src={path}
              />
            </div>
          </div>
          {fileAttachmentModal && (
            <FileAttachmentModal {...fileAttachmentModal} fileAttachmentModal={fileAttachmentModal} />
          )}
        </>
      ) : (
        <ImageAttachmentPlaceholder
          cid={cid}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          name={name}
          ext={ext}
          downloadStatus={downloadStatus}
        /> // Note that when we are processing / compressing images, we do not have CID, width, or height yet.
      )}
    </Root>
  )
}

export default ImageAttachment
