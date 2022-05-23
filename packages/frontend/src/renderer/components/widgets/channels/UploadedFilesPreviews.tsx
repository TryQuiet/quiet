import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { FileContent } from '@quiet/nectar'
import CloseIcon from '@material-ui/icons/Close'

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
    },
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
    position: 'relative'
  }
}))

const FilePreviewComponent: React.FC<FilePreviewComponentProps> = ({ fileData, onClick }) => {
  const classes = useStyles({})
  return <div className={classes.imageContainer}>
    <div className={classes.closeIconContainer} onClick={onClick}> <CloseIcon className={classes.closeIcon} /> </div>
    <img src={fileData.path} alt={fileData.name} className={classes.image} />
  </div>
}

export interface UploadFilesPreviewsProps {
  filesData: FilePreviewData
  removeFile: (id: string) => void
}

const UploadFilesPreviewsComponent: React.FC<UploadFilesPreviewsProps> = ({
  filesData,
  removeFile
}) => {
  const classes = useStyles({})

  return (
    <div className={classes.inputFiles}>
      {Object.entries(filesData).map((fileData) => <FilePreviewComponent fileData={fileData[1]} onClick={() => removeFile(fileData[0])} />)}
    </div>
  )
}

export default UploadFilesPreviewsComponent
