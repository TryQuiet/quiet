import React, { useEffect, useState } from 'react'
import { CircularProgress, makeStyles, Theme } from '@material-ui/core'
import { DisplayableMessage } from '@quiet/state-manager'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import UploadedFileModal from './UploadedFileModal'
import imagePlaceholderIcon from '../../../static/images/imagePlaceholderIcon.svg'
import Icon from '../../ui/Icon/Icon'
import { UploadedFilePlaceholder } from './UploadedFilePlaceholder'

const useStyles = makeStyles<Theme>(theme => ({
  image: {
    maxWidth: '100%'
  },
  container: {
    maxWidth: '400px',
    cursor: 'pointer'
  },
  placeholderWrapper: {
    maxWidth: '400px'
  },
  placeholder: {
    display: 'flex',
    alignContent: 'center',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginLeft: '0.5em'
  },
  placeholderIcon: {
    marginRight: '0.5em'
  },
  fileName: {
    color: 'gray'
  }
}))

export interface UploadedFileProps {
  message: DisplayableMessage
}

export const UploadedFile: React.FC<UploadedFileProps> = ({ message }) => {
  const classes = useStyles({})

  const [showImage, setShowImage] = useState<boolean>(false)
  const modal = useModal(ModalName.uploadedFileModal)

  // const path = message.media?.path
  const {path, width, height, name, ext} = message.media
  if (!path) {
    console.log('MESSAGE.media', path, name, ext, width, height)
  }
  

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
            <img className={classes.image} src={path} />
          </div>
          <UploadedFileModal {...modal} />
        </>
      ) : (
        <UploadedFilePlaceholder imageWidth={width} imageHeight={height} fileName={name} fileExt={ext}/>
      )}
    </>
  )
}

export default UploadedFile
