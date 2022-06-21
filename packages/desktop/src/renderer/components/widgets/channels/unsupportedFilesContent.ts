export enum unsuportedFileTitle {
  singleFile = 'File unsupported',
  someFiles = 'Some files unsuported'
}

export enum unsuportedFileContent {
  singleFileUnsupported = ' is not a file type Quiet supports.',
  someFilesUnsupported = 'some of these file types are not supported by Quiet:',
  tryUploadZip = 'Try uploading a .zip of this instead.',
  sendOtherFile = 'The other file will be sent',
  sendOtherFiles = 'The other files will be sent',
  currentUnsupportedModalContent = 'Sorry, but some of the files you added are not supported yet. Only image files can be uploaded.'
}

export const supportedFilesExtensions = ['.jpg', '.jpeg', '.png', '.gif']
