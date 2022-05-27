export enum unsuportedFileTitle {
  singleFile = 'File unsupported',
  someFiles = 'Some files unsuported'
}

export enum unsuportedFileContent {
  singleFileUnsupported = ' is not a file type Quiet supports.',
  someFilesUnsupported = 'some of these file types are not supported by Quiet:',

  tryUploadZip = 'Try uploading a .zip of this instead.',

  sendOtherFile = 'The other file will be sent',
  sendOtherFiles = 'The other files will be sent'
}

export const supportedFilesExtensions = ['.jpg', '.jpeg', '.png']