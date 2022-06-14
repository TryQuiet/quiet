import path from 'path'
import { FileContent } from '@quiet/state-manager'
import { FilePreviewData } from '../../renderer/components/widgets/channels/UploadedFilesPreviews'

export const getFileData = (filePath: string): FilePreviewData => {
  const fileContent: FileContent = {
    path: filePath,
    name: path.basename(filePath, path.extname(filePath)),
    ext: path.extname(filePath).toLowerCase()
  }
  const id = `${Date.now()}_${Math.random().toString(36).substring(0, 20)}`
  return { [id]: fileContent }
}

export const getFilesData = (filePaths: string[]): FilePreviewData => {
  const data = {}
  filePaths.forEach((filePath: string) => {
    Object.assign(data, getFileData(filePath))
  })
  return data
}
