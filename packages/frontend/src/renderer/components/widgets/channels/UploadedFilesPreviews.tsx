import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import FilePresentIcon from '@material-ui/icons/AttachFile'
import { FileContent } from '@quiet/nectar'
import CloseIcon from '@material-ui/icons/Close';

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
    marginLeft: '10px'
  },
  closeIcon: {
    position: 'absolute',
    margin: '0',
    padding: '0',
    right: '0px',
    top: '0px',
    backgroundColor: 'white',
    border: '0.5px solid black',
    borderRadius: '100%'
  },
  imageContainer: {
    position: 'relative'
  }
}))

const FilePreviewComponent: React.FC<FilePreviewComponentProps> = ({ fileData, onClick }) => {
  console.log('received data:', fileData)
  const classes = useStyles({})
  //@ts-expect-error
  const base64StringImage = btoa(new Uint8Array(fileData.buffer).reduce(function (data, byte) {
    return data + String.fromCharCode(byte);
  }, ''))

  return <div className={classes.imageContainer}>
    <div className={classes.closeIcon} onClick={onClick}> <CloseIcon /> </div>
    <img src={`data:image/png;base64,${base64StringImage}`} alt={fileData.name} className={classes.image} />
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