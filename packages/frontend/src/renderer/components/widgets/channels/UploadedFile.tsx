import React, { useEffect, useState } from 'react'
import { makeStyles } from '@material-ui/core'
import { DisplayableMessage } from '@quiet/nectar'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import UploadedFileModal from './UploadedFileModal'

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

export const UploadedFile = ({ message }) => {
  const classes = useStyles({})

  // const image = URL.createObjectURL(
  //   new Blob([message.message], { type: 'image/png' } /* (1) */)
  // )

  const [showImage, setShowImage] = useState<boolean>(false)
  const uploadedFileModal = useModal(ModalName.uploadedFileModal)

  useEffect(() => {
    if (uploadedFileModal.open) {
      setShowImage(false)
    }
  }, [uploadedFileModal.open])

  useEffect(() => {
    if (showImage) {
      uploadedFileModal.handleOpen({
        src: message.media?.path
      })
    }
  }, [showImage])

  return (
    <>
      <div className={classes.container} onClick={() => { setShowImage(true) }} >
        <img className={classes.image} src={message.media?.path} />
      </div>
      <UploadedFileModal {...uploadedFileModal} />
    </>
  )
}

export default UploadedFile
