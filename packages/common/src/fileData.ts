import path from 'path'
import { FileContent, FilePreviewData } from '@quiet/types'

export const getFileData = (filePath: string, isTmpPath = false): FilePreviewData => {
  const fileContent: FileContent = {
    path: filePath,
    tmpPath: isTmpPath ? filePath : undefined,
    name: path.basename(filePath, path.extname(filePath)),
    ext: path.extname(filePath).toLowerCase(),
  }
  const id = `${Date.now()}_${Math.random().toString(36).substring(0, 20)}`
  return { [id]: fileContent }
}

type FilePath = {
  path: string
  isTmp?: boolean
}

export const getFilesData = (filePaths: FilePath[]): FilePreviewData => {
  const data = {}
  filePaths.forEach((filePath: FilePath) => {
    Object.assign(data, getFileData(filePath.path, filePath.isTmp))
  })
  return data
}

export const fileToBase64String = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (reader.result) {
        resolve(reader.result as string)
      } else {
        reject(new Error(`Failed to read file, result: ${reader.result}`))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
