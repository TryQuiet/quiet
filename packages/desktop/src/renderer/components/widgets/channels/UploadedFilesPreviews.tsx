import React, { useEffect, useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { FileContent } from '@quiet/state-manager'
import CloseIcon from '@material-ui/icons/Close'
import Tooltip from '../../ui/Tooltip/Tooltip'
import UnsupportedFileModalComponent from './UnsupportedFileModal'
import { UseModalTypeWrapper } from '../../../containers/hooks'
import {
  supportedFilesExtensions,
  unsuportedFileContent,
  unsuportedFileTitle
} from './unsupportedFilesContent'

export interface FilePreviewData {
  [id: string]: FileContent
}

export interface FilePreviewComponentProps {
  fileData: FileContent
  onClick: () => void
}

const useStyles = makeStyles(() => ({
  inputFiles: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flexStart',
    alignItems: 'baseline',
    alignContent: 'stretch',
    paddingRight: '50px'
  },
  image: {
    width: '64px',
    height: '64px',
    borderRadius: '15%',
    marginLeft: '10px',
    objectFit: 'cover'
  },
  closeIconContainer: {
    position: 'absolute',
    margin: '0',
    padding: '0',
    right: '0px',
    top: '0px',
    backgroundColor: 'white',
    borderRadius: '100%',
    width: '22px',
    height: '22px',
    transform: 'translate(50%, -50%)',
    '&:hover': {
      backgroundColor: '#dddddd'
    }
  },
  closeIcon: {
    position: 'relative',
    left: '50%',
    top: '50%',
    color: '#444444',
    transform: 'translate(-50%, -50%)',
    '&:hover': {
      color: '#000000'
    },
    width: '17px'
  },
  imageContainer: {
    position: 'relative',
    cursor: 'pointer'
  },
  tooltip: {
    marginTop: '8px'
  }
}))

const FilePreviewComponent: React.FC<FilePreviewComponentProps> = ({ fileData, onClick }) => {
  const [showClose, setShowClose] = useState(false)
  const classes = useStyles({})
  return (
    <div
      className={classes.imageContainer}
      onMouseLeave={() => {
        setShowClose(false)
      }}
      onMouseOver={() => {
        setShowClose(true)
      }}>
      {showClose && (
        <Tooltip title='Remove' placement='top' className={classes.tooltip}>
          <div className={classes.closeIconContainer} onClick={onClick}>
            <CloseIcon className={classes.closeIcon} />
          </div>
        </Tooltip>
      )}

      <img src={fileData.path} alt={fileData.name} className={classes.image} />
    </div>
  )
}

export interface UploadFilesPreviewsProps {
  filesData: FilePreviewData
  unsupportedFileModal: ReturnType<UseModalTypeWrapper<{
    unsupportedFiles: FileContent[]
    title: string
    sendOtherContent: string
    textContent: string
    tryZipContent: string
  }>['types']>
  removeFile: (id: string) => void
}

const checkAreFilesSupported = (filesData: FilePreviewData) => {
  const unsupportedFiles: FileContent[] = []

  Object.entries(filesData).map(fileData => {
    const fileId = fileData[0]
    const fileContent = fileData[1]

    if (!supportedFilesExtensions.includes(fileContent.ext)) {
      unsupportedFiles.push(fileContent)
      delete filesData[fileId]
    }
  })

  return {
    supportedFiles: filesData,
    unsupportedFiles
  }
}

const UploadFilesPreviewsComponent: React.FC<UploadFilesPreviewsProps> = ({
  filesData,
  unsupportedFileModal,
  removeFile
}) => {
  const classes = useStyles({})

  const [isButtonClick, setButtonClick] = useState<boolean>(false)

  const { supportedFiles, unsupportedFiles } = checkAreFilesSupported(filesData)

  useEffect(() => {
    let title: string
    let sendOtherContent: string
    let textContent: string

    if (unsupportedFiles.length) {
      setButtonClick(false)

      if (unsupportedFiles.length === 1) {
        title = unsuportedFileTitle.singleFile
        textContent = unsuportedFileContent.singleFileUnsupported
      } else {
        title = unsuportedFileTitle.someFiles
        textContent = unsuportedFileContent.someFilesUnsupported
      }
      if (Object.keys(supportedFiles).length === 1) {
        sendOtherContent = unsuportedFileContent.sendOtherFile
      } else if (Object.keys(supportedFiles).length > 1) {
        sendOtherContent = unsuportedFileContent.sendOtherFiles
      } else {
        sendOtherContent = ''
      }

      unsupportedFileModal.handleOpen({
        unsupportedFiles,
        title,
        sendOtherContent,
        textContent,
        tryZipContent: unsuportedFileContent.tryUploadZip
      })
    }
  }, [filesData, unsupportedFiles])

  useEffect(() => {
    if (isButtonClick) {
      unsupportedFileModal.handleClose()
    }
  }, [isButtonClick])

  return (
    <div className={classes.inputFiles}>
      {Object.entries(supportedFiles).map(fileData => (
        <FilePreviewComponent fileData={fileData[1]} onClick={() => removeFile(fileData[0])} />
      ))}
      <UnsupportedFileModalComponent
        {...unsupportedFileModal}
        onButtonClick={() => {
          setButtonClick(true)
        }}
      />
    </div>
  )
}

export default UploadFilesPreviewsComponent
