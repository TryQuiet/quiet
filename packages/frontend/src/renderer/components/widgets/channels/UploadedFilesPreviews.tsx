import React, { useCallback } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import FilePresentIcon from '@material-ui/icons/AttachFile'
import { FileContent } from '@quiet/nectar'

export interface UploadFilesPreviewsProps {
  filesData: Array<FileContent>
}

export interface FilePreviewComponentProps {
  fileData: FileContent
}

const useStyles = makeStyles({})

const FilePreviewComponent: React.FC<FilePreviewComponentProps> = ({fileData}) => {
  console.log('received data:', fileData)
  return <FilePresentIcon />
}

const UploadFilesPreviewsComponent: React.FC<UploadFilesPreviewsProps> = ({
  filesData,
}) => {
  const classes = useStyles({})
  
  return <React.Fragment>{filesData.map((fileData) => <FilePreviewComponent fileData={fileData}/>)}</React.Fragment>
}

export default UploadFilesPreviewsComponent