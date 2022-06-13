import React, { useEffect, useState } from 'react'
import { makeStyles } from '@material-ui/core'
import { DisplayableMessage } from '@quiet/state-manager'
import { UseModalTypeWrapper } from '../../../containers/hooks'
import UploadedFileModal from './UploadedFileModal'
import { UploadedFilename, UploadedFilePlaceholder } from './UploadedFilePlaceholder'

const useStyles = makeStyles(() => ({
  image: {
    maxWidth: '100%'
  },
  container: {
    maxWidth: '400px',
    cursor: 'pointer'
  }
}))

export interface UploadedFileProps {
  message: DisplayableMessage
  uploadedFileModal?: ReturnType<UseModalTypeWrapper<{
    src: string
  }>['types']>
}

export const UploadedFile: React.FC<UploadedFileProps> = ({ message, uploadedFileModal }) => {
  const classes = useStyles({})

  const [showImage, setShowImage] = useState<boolean>(false)

  const { cid, path, width, height, name, ext } = message.media

  const fullFileName = `${name}${ext}`

  useEffect(() => {
    if (uploadedFileModal?.open) {
      setShowImage(false)
    }
  }, [uploadedFileModal?.open])

  useEffect(() => {
    if (showImage) {
      uploadedFileModal?.handleOpen({
        src: path
      })
    }
  }, [showImage])

  return (
    <>
      {path ? (
        <>
          <div
            className={classes.container}
            onClick={() => {
              setShowImage(true)
            }}>
            <div className={classes.image} data-testid={`${cid}-imageVisual`}>
              <UploadedFilename fileName={fullFileName} />
              <img className={classes.image} src={path} />
            </div>
          </div>
          <UploadedFileModal {...uploadedFileModal} uploadedFileModal={uploadedFileModal} />
        </>
      ) : (
        <UploadedFilePlaceholder cid={cid} imageWidth={width} imageHeight={height} fileName={fullFileName} />
      )}
    </>
  )
}

export default UploadedFile
