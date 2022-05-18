import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import FilePresentIcon from '@material-ui/icons/AttachFile'
import { FileContent } from '@quiet/nectar'

export interface FilePreviewData {
  [id: string]: FileContent
}

export interface FilePreviewComponentProps {
  fileData: FileContent
  onClick: () => void
}

const useStyles = makeStyles({})

const FilePreviewComponent: React.FC<FilePreviewComponentProps> = ({fileData, onClick}) => {
  return <FilePresentIcon onClick={onClick}/>
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
    <React.Fragment>
      {Object.entries(filesData).map((fileData) => <FilePreviewComponent fileData={fileData[1]} onClick={() => removeFile(fileData[0])}/>)}
    </React.Fragment>
  )
}

export default UploadFilesPreviewsComponent