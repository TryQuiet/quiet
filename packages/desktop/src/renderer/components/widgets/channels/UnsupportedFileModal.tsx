import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import Modal from '../../ui/Modal/Modal'
import IconButton from '../../ui/Icon/IconButton'
import LoadingButton from '../../ui/LoadingButton/LoadingButton'

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    height: '100%'
  },
  sendOtherContent: {
    margin: '5px'
  },
  unsupportedFiles: {
    margin: '5px'

  },
  textContent: {
    margin: '5px'
  },
  tryZip: {},
  modalText: {
    position: 'absolute',
    textAlign: 'center',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%'
  },
  button: {
    position: 'absolute',
    bottom: '0px',
    left: '50%',
    transform: 'translate(-50%, 60%)'
  },
  loadingButton: {
    width: '200px'
  }
}))

interface unsupportedFileModalProps {
  open: boolean
  handleClose: () => void
  onButtonClick: () => void
}

const UnsupportedFileModalComponent: React.FC<unsupportedFileModalProps> = ({
  open,
  handleClose,
  onButtonClick
}) => {
  const classes = useStyles({})
  const hideForNow = true
  const { unsupportedFiles, sendOtherContent, textContent, tryZipContent } = useModal(ModalName.unsupportedFileModal)

  return (
    <Modal open={open} handleClose={handleClose} title={'Some files unsupported'}
      windowed={true} isBold={true} contentWidth={'50vw'} contentHeight={'30vh'} fullPage={false}>
      {/* hide for now */}
      {
        !hideForNow
          ? <div className={classes.root}>

            <div className={classes.textContent}>
              Sorry, {unsupportedFiles && unsupportedFiles.length === 1 ? <b>{unsupportedFiles[0].name}{unsupportedFiles[0].ext}</b>
                : <></>
              }

              {textContent}
            </div>

            <div className={classes.unsupportedFiles}>
              {unsupportedFiles && unsupportedFiles.length > 1 ? unsupportedFiles.map((item) => {
                return <p><b>{item.name}{item.ext}</b></p>
              })
                : <></>
              }
            </div>

            <div className={classes.tryZip}>
              {tryZipContent}
            </div>
            <div className={classes.sendOtherContent}>
              {sendOtherContent}
            </div>
          </div>

          : <div className={classes.root}>
            <div className={classes.modalText}>
              Sorry, but some of the files you added are not supported yet. For now, Quiet only supports images under 10MB in size.
            </div>
            <div className={classes.button}>
              <LoadingButton onClick={onButtonClick} text={' OK '} />
            </div>
          </div>

      }
    </Modal >
  )
}

export default UnsupportedFileModalComponent
