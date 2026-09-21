import path from 'path'
import { FileContent, FilePreviewData } from '@quiet/types'

let nextPreviewId = 0

export const getFileData = (filePath: string, isTmpPath = false): FilePreviewData => {
  const fileContent: FileContent = {
    path: filePath,
    tmpPath: isTmpPath ? filePath : undefined,
    name: path.basename(filePath, path.extname(filePath)),
    ext: path.extname(filePath).toLowerCase(),
  }
  // These keys identify removable UI previews, not uploaded files or secrets.
  // A counter preserves every selection made in one clock tick; the process
  // prefix separates Electron's native picker from renderer drag-and-drop.
  const producer = typeof process === 'object' && typeof process.pid === 'number' ? process.pid : 'ui'
  const id = `preview_${producer}_${Date.now()}_${nextPreviewId++}`
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
