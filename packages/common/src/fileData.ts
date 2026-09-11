import path from 'path'
import { FileContent, FilePreviewData } from '@quiet/types'

/**
 * Percent-decode a file name, leaving it untouched if it is not valid encoding.
 *
 * Mobile file pickers hand us URIs (`file:///.../My%20File.pdf`), so a name taken
 * straight from the path reaches the UI - and peers - as `My%20File` (#1701).
 * `sendFileMessageSaga` already percent-decodes `path` before the file is read
 * from disk, so decoding here keeps the displayed name in step with the file that
 * is actually attached. Desktop supplies plain OS paths, which contain no `%` and
 * so pass through unchanged. A name that genuinely contains `%` (`100%.txt`)
 * arrives undecoded and would make `decodeURIComponent` throw, hence the fallback.
 */
export const decodeFileName = (name: string): string => {
  try {
    return decodeURIComponent(name)
  } catch {
    return name
  }
}

export const getFileData = (filePath: string, isTmpPath = false): FilePreviewData => {
  // basename() runs again below on the decoded name: decoding can reveal a path
  // separator (`%2F`), and `name` must stay a bare file name - it is interpolated
  // into a path when the backend copies the attachment into its uploads directory.
  const fileName = decodeFileName(path.basename(filePath))
  const fileContent: FileContent = {
    path: filePath,
    tmpPath: isTmpPath ? filePath : undefined,
    name: path.basename(fileName, path.extname(fileName)),
    ext: path.extname(fileName).toLowerCase(),
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
