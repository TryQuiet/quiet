import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import FilePresentIcon from '@material-ui/icons/AttachFile'
import { FileContent } from '@quiet/nectar'

export interface FilePreviewInterface extends FileContent {
  id: string,
  path: string
}

export interface FilePreviewComponentProps {
  fileData: FilePreviewInterface
  onClick: () => void
}

const useStyles = makeStyles({})

const FilePreviewComponent: React.FC<FilePreviewComponentProps> = ({fileData, onClick}) => {
  console.log('received data:', fileData)
  return <FilePresentIcon onClick={onClick}/>
}

export interface UploadFilesPreviewsProps {
  filesData: Array<FilePreviewInterface>
  removeFile: (id: string) => void
}


const UploadFilesPreviewsComponent: React.FC<UploadFilesPreviewsProps> = ({
  filesData,
  removeFile
}) => {
  const classes = useStyles({})
  
  return (
    <React.Fragment>
      {filesData.map((fileData) => <FilePreviewComponent fileData={fileData} onClick={() => removeFile(fileData.id)}/>)}
    </React.Fragment>
  )
}

export default UploadFilesPreviewsComponent