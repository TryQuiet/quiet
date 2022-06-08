import React, { useEffect, useState } from 'react'
import { makeStyles } from '@material-ui/core'
import { DisplayableMessage } from '@quiet/state-manager'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
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
}

export const UploadedFile: React.FC<UploadedFileProps> = ({ message }) => {
  const classes = useStyles({})

  const [showImage, setShowImage] = useState<boolean>(false)
  const modal = useModal(ModalName.uploadedFileModal)

  const { path, width, height, name, ext } = message.media
  const fullFileName = `${name}${ext}`

  useEffect(() => {
    if (modal.open) {
      setShowImage(false)
    }
  }, [modal.open])

  useEffect(() => {
    if (showImage) {
      modal.handleOpen({
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
            <div className={classes.image}>
              <UploadedFilename fileName={fullFileName}/>
              <img className={classes.image} src={path} />
            </div>
          </div>
          <UploadedFileModal {...modal} />
        </>
      ) : (
        <UploadedFilePlaceholder imageWidth={width} imageHeight={height} fileName={fullFileName}/>
      )}
    </>
  )
}

export default UploadedFile
