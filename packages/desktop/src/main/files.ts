import { getFileData } from '../utils/functions/fileData'

export const openFiles = (paths: string[]) => {
  const data = {}
  paths.forEach((filePath: string) => {
    Object.assign(data, getFileData(filePath))
  })
  return data
}
